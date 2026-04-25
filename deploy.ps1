# Configurações do Servidor
$IP = "82.25.68.234"
$USER = "root"
$REMOTE_PATH = "/root/saas-delivery"

Write-Host "--- INICIANDO DEPLOY TURBO (GIT) ---" -ForegroundColor Cyan

# 1. Garantir que o código local está no GitHub
Write-Host "1. Sincronizando com GitHub..."
git push origin main --tags

# 2. Enviar o .env (já que ele não vai pelo Git)
Write-Host "2. Atualizando configurações (.env)..."
scp .env "$USER@$($IP):$REMOTE_PATH/.env"

# 3. Comandos Remotos via Git
Write-Host "3. Puxando código novo e reconstruindo na VPS..."
$remoteCommands = @"
cd $REMOTE_PATH
# Se o git não estiver inicializado, inicializa agora
if [ ! -d .git ]; then
    git init
    git remote add origin git@github.com:pedeueapp-glitch/pedeue.git
fi

# Puxa apenas as mudanças (rápido)
git fetch --all
git reset --hard origin/main

# Sobe os containers (Docker usa cache, então é ultra rápido se pouco mudou)
echo "Reiniciando containers..."
docker compose up -d --build --remove-orphans

# Sincroniza o banco de dados
echo "Sincronizando banco de dados..."
docker compose exec -T app npx prisma db push --accept-data-loss

echo "Verificando status..."
docker compose ps
"@

ssh $USER@$IP $remoteCommands

Write-Host "--- DEPLOY CONCLUÍDO COM SUCESSO! ---" -ForegroundColor Green
Write-Host "Sua aplicação está online em: http://$IP"
