#!/bin/bash

echo "🚀 Iniciando Arbitron..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Iniciando..."
    sudo systemctl start docker
    sudo systemctl enable docker
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down

# Limpar containers antigos
echo "🧹 Limpando containers antigos..."
docker system prune -f

# Construir e iniciar serviços
echo "🏗️ Construindo e iniciando serviços..."
docker-compose -f docker-compose.prod.yml up --build -d

# Aguardar serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 30

# Verificar status dos serviços
echo "🔍 Verificando status dos serviços..."

PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Verificar Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend rodando: http://$PUBLIC_IP:3000"
else
    echo "❌ Frontend não está respondendo"
fi

# Verificar API
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ API rodando: http://$PUBLIC_IP:8000"
else
    echo "❌ API não está respondendo"
fi

# Verificar Security Backend
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Security Backend rodando: http://$PUBLIC_IP:3001"
else
    echo "❌ Security Backend não está respondendo"
fi

echo ""
echo "🎉 Arbitron está online!"
echo "📊 Dashboard: http://$PUBLIC_IP:3000"
echo "📚 API Docs: http://$PUBLIC_IP:8000/docs"
echo ""
echo "📋 Para monitorar logs:"
echo "docker-compose -f docker-compose.prod.yml logs -f"
