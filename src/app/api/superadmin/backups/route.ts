import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export const dynamic = 'force-dynamic';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename");

  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    if (filename) {
      const filePath = path.join(BACKUP_DIR, filename);
      
      // Segurança: impede path traversal
      if (!filePath.startsWith(BACKUP_DIR) || !fs.existsSync(filePath)) {
        return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(filePath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/sql",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
      .map(f => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f));
        return {
          name: f,
          size: (stats.size / 1024 / 1024).toFixed(2) + " MB",
          createdAt: stats.mtime
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ backups: files });
  } catch (error) {
    console.error("BACKUP_GET_ERROR:", error);
    return NextResponse.json({ error: "Erro ao processar backups" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, filename } = await req.json();

  try {
    if (action === "create") {
      // Executa o script de backup
      try {
        execSync(`node scripts/backup-manager.js --create`, { stdio: 'pipe' });
        return NextResponse.json({ message: "Backup criado com sucesso" });
      } catch (error: any) {
        const output = error.stderr?.toString() || error.message;
        console.error("DEBUG - Backup Error:", output);
        return NextResponse.json({ error: "Falha no comando de backup: " + output }, { status: 500 });
      }
    }

    if (action === "restore" && filename) {
      // Executa a restauração
      try {
        execSync(`node scripts/backup-manager.js --restore ${filename}`, { stdio: 'pipe' });
        return NextResponse.json({ message: "Banco de dados restaurado com sucesso" });
      } catch (error: any) {
        const output = error.stderr?.toString() || error.message;
        console.error("DEBUG - Restore Error:", output);
        return NextResponse.json({ error: "Falha na restauração: " + output }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("BACKUP_ACTION_ERROR:", error);
    return NextResponse.json({ error: "Erro ao processar backup: " + error.message }, { status: 500 });
  }
}
