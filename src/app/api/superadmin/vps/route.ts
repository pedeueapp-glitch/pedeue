export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import os from "os";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Informações de Memória
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = ((usedMem / totalMem) * 100).toFixed(2);

    // 2. Informações de CPU
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuUsage = os.loadavg()[0].toFixed(2); // Load average de 1 min

    // 3. Informações de Disco (df -h)
    let diskUsage = "Não disponível";
    try {
      // Tenta rodar df no linux/mac
      const df = execSync("df -h / | tail -1").toString().split(/\s+/);
      diskUsage = df[4]; // Porcentagem de uso
    } catch (e) {
      // Fallback para Windows ou erro
      diskUsage = "N/A";
    }

    // 4. Informações de Rede (Trafego)
    let networkStats = { rx: 0, tx: 0 };
    try {
      if (os.platform() === 'linux') {
        const netDev = fs.readFileSync("/proc/net/dev", "utf8");
        const lines = netDev.split("\n");
        // Soma o tráfego de todas as interfaces (exceto lo)
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts[0] && !parts[0].startsWith("lo") && parts.length > 10) {
            networkStats.rx += parseInt(parts[1]) || 0;
            networkStats.tx += parseInt(parts[9]) || 0;
          }
        });
      }
    } catch (e) {
      console.error("Erro ao ler tráfego de rede:", e);
    }

    // 5. Ler Logs (Simulação ou leitura de arquivos reais se existirem)
    // Vamos tentar ler de uma pasta 'logs' na raiz do projeto
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const getLogs = (filename: string) => {
      const filePath = path.join(logsDir, filename);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        return content.split("\n").slice(-50).join("\n"); // Últimas 50 linhas
      }
      return `Aguardando logs em ${filename}...`;
    };

    return NextResponse.json({
      vps: {
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        cpu: {
          model: cpuModel,
          cores: cpus.length,
          usage: cpuUsage
        },
        memory: {
          total: (totalMem / (1024 ** 3)).toFixed(2) + " GB",
          used: (usedMem / (1024 ** 3)).toFixed(2) + " GB",
          usage: memUsage
        },
        disk: {
          usage: diskUsage
        },
        network: networkStats
      },
      logs: {
        next: getLogs("next.log"),
        socket: getLogs("socket.log")
      }
    });

  } catch (error: any) {
    console.error("VPS_STATS_ERROR:", error);
    return NextResponse.json({ error: "Erro ao buscar dados da VPS" }, { status: 500 });
  }
}
