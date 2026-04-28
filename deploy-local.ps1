# Configurações do Servidor de PRODUÇÃO
$IP = "82.25.68.234"
$USER = "root"
$REMOTE_PATH = "/root/saas-delivery"

Write-Host "--- INICIANDO DEPLOY LOCAL (SEM GIT) ---" -ForegroundColor Cyan

# 1. Preparando arquivos
Write-Host "1. Compactando projeto..."
if (Test-Path "deploy_prod.tar.gz") { Remove-Item "deploy_prod.tar.gz" }

# Compacta excluindo pastas pesadas
tar --exclude="node_modules" --exclude=".next" --exclude=".git" -czf deploy_prod.tar.gz .

# 2. Enviando para o servidor
Write-Host "2. Enviando arquivos para a VPS ($IP)..."
scp deploy_prod.tar.gz "$USER@$($IP):$REMOTE_PATH"
scp .env "$USER@$($IP):$REMOTE_PATH/.env"

# 3. Comandos Remotos de Build Limpo
Write-Host "3. Extraindo e realizando Build Limpo na VPS..."
$remoteCommands = @"
cd $REMOTE_PATH
tar -xzf deploy_prod.tar.gz
rm deploy_prod.tar.gz

echo "Parando containers atuais..."
docker compose down

echo "Iniciando BUILD LIMPO sem cache..."
docker compose build --no-cache

echo "Subindo nova versao..."
docker compose up -d --remove-orphans

echo "Sincronizando banco de dados..."
docker compose exec -T app npx prisma db push --accept-data-loss

echo "Status dos containers:"
docker compose ps
"@

ssh $USER@$IP $remoteCommands

# 4. Limpeza local
Remove-Item "deploy_prod.tar.gz"

Write-Host "--- DEPLOY LOCAL CONCLUÍDO COM SUCESSO! ---" -ForegroundColor Green
Write-Host "Sua aplicação está sendo atualizada em: https://pedeue.com"
