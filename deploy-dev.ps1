# Configurações do Servidor de TESTE
$IP = "82.25.68.234"
$USER = "root"
$REMOTE_PATH = "/root/saas-delivery-dev" # Pasta diferente da produção

Write-Host "--- INICIANDO DEPLOY (DEV) ---" -ForegroundColor Yellow

# 1. Limpando resíduos locais
Write-Host "1. Preparando arquivos..."
if (Test-Path "deploy_dev.tar.gz") { Remove-Item "deploy_dev.tar.gz" }

# 2. Compactando projeto
# Incluindo .env.dev que será usado no servidor
tar --exclude="node_modules" --exclude=".next" --exclude=".git" -czf deploy_dev.tar.gz .

# 3. Criando diretório remoto e enviando
Write-Host "2. Enviando para o servidor de teste ($IP)..."
ssh $USER@$IP "mkdir -p $REMOTE_PATH"
scp deploy_dev.tar.gz "$USER@$($IP):$REMOTE_PATH"

# 4. Extraindo e subindo Docker DEV
Write-Host "3. Extraindo e subindo containers de teste..."
$remoteCommands = @"
cd $REMOTE_PATH
tar -xzf deploy_dev.tar.gz
rm deploy_dev.tar.gz
# Copia o .env.dev para .env para que o docker compose pegue por padrão se necessário
cp .env.dev .env 
docker compose -f docker-compose.dev.yml build
docker compose -f docker-compose.dev.yml up -d --force-recreate --remove-orphans
# Rodar o seed para garantir que a conta do usuário e loja existam (Desativado para preservar dados)
sleep 10 # Aguarda o app subir
# docker compose -f docker-compose.dev.yml exec -T app npx prisma db seed
"@

ssh $USER@$IP $remoteCommands

# 5. Limpeza local
Remove-Item "deploy_dev.tar.gz"

Write-Host "--- DEPLOY DEV CONCLUÍDO! ---" -ForegroundColor Green
Write-Host "Ambiente de teste subindo em: https://dev.pedeue.com"
Write-Host "Porta interna do container: 3001"
