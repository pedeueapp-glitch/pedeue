#!/bin/sh

echo "🚀 Iniciando processo de deploy..."

# Loop para aguardar o banco de dados estar disponível e realizar o push
while true; do
  echo "📦 Tentando sincronizar banco de dados (Prisma)..."
  npx prisma db push --accept-data-loss
  
  if [ $? -eq 0 ]; then
    echo "✅ Sincronização concluída com sucesso!"
    break
  else
    echo "⏳ Falha na conexão ou erro no push. Tentando novamente em 5 segundos..."
    sleep 5
  fi
done

# Opcional: Rodar seed se for a primeira vez
# npx prisma db seed

echo "✅ Ambiente pronto!"

# Inicia o monitor de backups em background
node scripts/backup-manager.js --cron &

# Garante que a pasta de logs existe
mkdir -p logs

echo "🔥 Iniciando servidor Next.js..."
# Redireciona stdout e stderr para o arquivo e para o console
node server.js 2>&1 | tee -a logs/next.log

