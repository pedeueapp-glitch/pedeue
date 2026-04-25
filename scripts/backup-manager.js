const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Diretório de backups absoluto para evitar problemas de path em Docker/Standalone
const BACKUP_DIR = path.join(process.cwd(), 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Carregar .env manualmente se DATABASE_URL não estiver definida
if (!process.env.DATABASE_URL) {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }
}

function parseDatabaseUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    return {
      user: url.username,
      password: url.password,
      host: url.hostname,
      port: url.port || "3306",
      database: url.pathname.replace("/", "")
    };
  } catch (e) {
    // Fallback para regex caso não seja uma URL válida padrão
    const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = urlStr.match(regex);
    if (!match) throw new Error("DATABASE_URL inválida: " + urlStr);
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5]
    };
  }
}

function createBackup() {
  console.log(`[${new Date().toLocaleString()}] Iniciando script de backup...`);
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL não configurada.");
    return;
  }

  try {
    // Verifica se mysqldump existe
    try {
      execSync('mysqldump --version');
    } catch (e) {
      throw new Error("O utilitário 'mysqldump' não foi encontrado no sistema. Se estiver em ambiente Docker, certifique-se de que o mysql-client está instalado.");
    }

    const { user, password, host, port, database } = parseDatabaseUrl(dbUrl);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);

    // Executa mysqldump usando MYSQL_PWD para segurança e desativando SSL
    const cmd = `mysqldump -h ${host} -P ${port} -u ${user} --skip-ssl ${database} > ${filePath}`;
    execSync(cmd, {
      env: { ...process.env, MYSQL_PWD: password }
    });


    console.log(`✅ Backup criado: ${filename}`);

    // Rotação: manter apenas 5 mais recentes
    rotateBackups();
  } catch (error) {
    console.error("❌ Erro ao criar backup:", error.message);
    process.exit(1); // Importante para que o execSync da API detecte a falha
  }
}

function rotateBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
    .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);

  if (files.length > 5) {
    const toDelete = files.slice(5);
    toDelete.forEach(file => {
      fs.unlinkSync(path.join(BACKUP_DIR, file.name));
      console.log(`🗑️ Backup antigo removido: ${file.name}`);
    });
  }
}

function restoreBackup(filename) {
  console.log(`[${new Date().toLocaleString()}] Restaurando backup: ${filename}...`);
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL não configurada.");

  const filePath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filePath)) throw new Error("Arquivo de backup não encontrado");

  try {
    const { user, password, host, port, database } = parseDatabaseUrl(dbUrl);
    
    // Usamos --force para garantir que o script continue mesmo se encontrar avisos
    // Aumentamos o maxBuffer para 500MB para suportar bancos maiores
    const cmd = `mysql -h ${host} -P ${port} -u ${user} --protocol=tcp --skip-ssl --force ${database} < ${filePath}`;
    
    console.log(`Executando comando de restauração para o banco: ${database}`);
    
    execSync(cmd, {
      env: { ...process.env, MYSQL_PWD: password },
      maxBuffer: 1024 * 1024 * 500 // 500MB de buffer
    });

    console.log("✅ Restauração concluída com sucesso!");
    return true;
  } catch (error) {
    const errorOutput = error.stderr ? error.stderr.toString() : error.message;
    console.error("❌ Erro detalhado na restauração:", errorOutput);
    throw new Error(`Falha na restauração: ${errorOutput}`);
  }
}

// Se executado diretamente
if (require.main === module) {
  const arg = process.argv[2];
  if (arg === '--create') {
    createBackup();
  } else if (arg === '--restore' && process.argv[3]) {
    restoreBackup(process.argv[3]);
  } else if (arg === '--cron') {
    // Loop de agendamento simples
    console.log("⏰ Monitor de backup iniciado. Agendado para as 03:00 (Brasília).");
    setInterval(() => {
      const now = new Date();
      // Verifica se é 03:00:00 (com margem de 1 minuto)
      if (now.getHours() === 3 && now.getMinutes() === 0) {
        createBackup();
      }
    }, 60000); // Verifica a cada minuto
  }
}

module.exports = { createBackup, restoreBackup, BACKUP_DIR };
