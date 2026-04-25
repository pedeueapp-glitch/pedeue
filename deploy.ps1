# Configurações do Servidor
$IP = "82.25.68.234"
$USER = "root"
$REMOTE_PATH = "/root/saas-delivery"

Write-Host "--- INICIANDO DEPLOY ---" -ForegroundColor Cyan

# 1. Limpando resíduos locais
Write-Host "1. Preparando arquivos..."
if (Test-Path "deploy_package.tar.gz") { Remove-Item "deploy_package.tar.gz" }

# 2. Compactando projeto (Usando tar)
# Incluindo o .env para que o servidor tenha as chaves de produção
# EXCLUINDO o .env.local para não quebrar a produção com links localhost
tar --exclude="node_modules" --exclude=".next" --exclude=".git" --exclude="*.tar.gz" --exclude="db_data" --exclude="build" --exclude="dist" --exclude=".env.local" -czf deploy_package.tar.gz .

# 3. Criando diretório remoto e enviando
Write-Host "2. Enviando para o servidor ($IP)..."
ssh $USER@$IP "mkdir -p $REMOTE_PATH"
scp deploy_package.tar.gz "$USER@$($IP):$REMOTE_PATH"

# 4. Extraindo e subindo Docker
Write-Host "3. Atualizando arquivos no servidor e reiniciando containers..."
$remoteCommands = @"
cd $REMOTE_PATH
# Extrai apenas os arquivos novos (sobrescrevendo os antigos)
tar -xzf deploy_package.tar.gz

# Remove resquícios de .env.local que possam ter subido por erro
rm -f .env.local

# Limpeza profunda no servidor antes de começar
echo "Limpando ambiente no servidor..."
docker compose down --remove-orphans
docker system prune -af

# Garante que a rede externa existe
docker network create proxy-network || true

# reconstrói sem cache
echo "Iniciando build limpo sem cache..."
docker compose build --no-cache

# Sobe os containers
docker compose up -d --remove-orphans

docker image prune -f

# Aguarda o banco (curto) e aplica as migrações se houver
echo "Verificando migrações e sincronizando banco..."
docker compose exec -T app npx prisma db push --accept-data-loss
docker compose exec -T app npx prisma migrate deploy

echo "Atualizando Webhook da Efí..."
docker compose exec -T app npx tsx scripts/register-webhook.ts

echo "Verificando status dos containers..."
docker compose ps
"@


ssh $USER@$IP $remoteCommands

# 5. Limpeza local
Remove-Item "deploy_package.tar.gz"

Write-Host "--- DEPLOY CONCLUÍDO COM SUCESSO! ---" -ForegroundColor Green
Write-Host "Sua aplicação está subindo em: http://$IP:3000"
