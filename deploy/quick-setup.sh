#!/bin/bash

echo "🚀 Arbitron - Quick AWS EC2 Setup"
echo "================================="

# Cores para logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Obter IP público da instância
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
log_info "IP Público detectado: $PUBLIC_IP"

# Atualizar sistema
log_info "Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências essenciais
log_info "Instalando dependências..."
sudo apt install -y curl wget git unzip software-properties-common

# Instalar Docker
log_info "Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
log_info "Instalando Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configurar firewall
log_info "Configurando firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 3000
sudo ufw allow 8000
sudo ufw allow 3001
sudo ufw --force enable

# Clonar repositório
log_info "Clonando Arbitron..."
cd /home/$USER
rm -rf Arbitron
git clone https://github.com/MauricioJSNeto/Arbitron.git
cd Arbitron

# Gerar chaves de segurança
JWT_SECRET=$(openssl rand -hex 32)
REFRESH_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)

# Criar arquivo .env
log_info "Configurando variáveis de ambiente..."
cat > .env << EOF
# Arbitron - AWS EC2 Configuration
PROJECT_NAME=Arbitron
NODE_ENV=production
PUBLIC_IP=$PUBLIC_IP

# URLs de acesso
NEXT_PUBLIC_API_URL=http://$PUBLIC_IP:8000
NEXT_PUBLIC_SECURITY_URL=http://$PUBLIC_IP:3001
NEXT_PUBLIC_WS_URL=ws://$PUBLIC_IP:8000/ws

# Segurança
JWT_SECRET=$JWT_SECRET
REFRESH_TOKEN_SECRET=$REFRESH_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Banco de dados
POSTGRES_USER=arbitron_user
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=arbitron_db
DATABASE_URL=postgresql://arbitron_user:$DB_PASSWORD@postgres:5432/arbitron_db

# Redis
REDIS_URL=redis://redis:6379

# IMPORTANTE: Configure suas chaves de API das exchanges
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_SECRET_KEY=your_binance_secret_key_here
KRAKEN_API_KEY=your_kraken_api_key_here
KRAKEN_SECRET_KEY=your_kraken_secret_key_here

# Configurações do bot
MIN_PROFIT_THRESHOLD=0.5
MAX_TRADE_AMOUNT=100
SIMULATION_MODE=true
EOF

# Criar .env para security-backend
mkdir -p security-backend
cat > security-backend/.env << EOF
PORT=3001
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=$REFRESH_SECRET
REFRESH_TOKEN_EXPIRES_IN=7d
ENCRYPTION_KEY=$ENCRYPTION_KEY
DATABASE_URL=postgresql://arbitron_user:$DB_PASSWORD@postgres:5432/arbitron_security_db
CORS_ORIGIN=http://$PUBLIC_IP:3000
EOF

# Criar docker-compose simplificado para EC2
log_info "Criando configuração Docker..."
cat > docker-compose.ec2.yml << EOF
version: '3.8'

services:
  frontend:
    build: 
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://$PUBLIC_IP:8000
      - NEXT_PUBLIC_SECURITY_URL=http://$PUBLIC_IP:3001
      - NEXT_PUBLIC_WS_URL=ws://$PUBLIC_IP:8000/ws
    depends_on:
      - security-backend
      - arbitrage-engine
    networks:
      - arbitron-net
    restart: unless-stopped

  security-backend:
    build: 
      context: ./security-backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    env_file:
      - security-backend/.env
    depends_on:
      - postgres
    networks:
      - arbitron-net
    restart: unless-stopped

  arbitrage-engine:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - POSTGRES_URL=postgresql://arbitron_user:$DB_PASSWORD@postgres:5432/arbitron_arbitrage_db
      - API_HOST=0.0.0.0
      - API_PORT=8000
      - PUBLIC_IP=$PUBLIC_IP
    depends_on:
      - redis
      - postgres
    networks:
      - arbitron-net
    restart: unless-stopped

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_USER=arbitron_user
      - POSTGRES_PASSWORD=$DB_PASSWORD
      - POSTGRES_DB=arbitron_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - arbitron-net
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - arbitron-net
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  arbitron-net:
    driver: bridge
EOF

# Criar script de inicialização
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Arbitron..."

# Aplicar permissões Docker
newgrp docker << EONG
# Parar containers existentes
docker-compose -f docker-compose.ec2.yml down

# Limpar sistema
docker system prune -f

# Construir e iniciar
docker-compose -f docker-compose.ec2.yml up --build -d

# Aguardar inicialização
sleep 30

# Verificar status
PUBLIC_IP=\$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo "🔍 Verificando serviços..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend: http://\$PUBLIC_IP:3000"
else
    echo "❌ Frontend não está respondendo"
fi

if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ API: http://\$PUBLIC_IP:8000/docs"
else
    echo "❌ API não está respondendo"
fi

if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Security: http://\$PUBLIC_IP:3001/health"
else
    echo "❌ Security Backend não está respondendo"
fi

echo ""
echo "🎉 Arbitron configurado!"
echo "📊 Dashboard: http://\$PUBLIC_IP:3000"
echo "📚 API Docs: http://\$PUBLIC_IP:8000/docs"
echo "🔐 Security: http://\$PUBLIC_IP:3001/health"
EONG
EOF

chmod +x start.sh

# Configurar permissões
sudo chown -R $USER:$USER /home/$USER/Arbitron

log_success "Configuração concluída!"
echo ""
echo "🔧 PRÓXIMOS PASSOS:"
echo "==================="
echo "1. Configure suas chaves de API em .env"
echo "2. Execute: ./start.sh"
echo "3. Acesse: http://$PUBLIC_IP:3000"
echo ""
echo "📋 INFORMAÇÕES IMPORTANTES:"
echo "=========================="
echo "IP Público: $PUBLIC_IP"
echo "Dashboard: http://$PUBLIC_IP:3000"
echo "API Docs: http://$PUBLIC_IP:8000/docs"
echo "Security: http://$PUBLIC_IP:3001/health"
echo ""
echo "🔐 CHAVES GERADAS (salve em local seguro):"
echo "=========================================="
echo "JWT_SECRET: $JWT_SECRET"
echo "DB_PASSWORD: $DB_PASSWORD"
echo ""
log_warning "IMPORTANTE: Configure as chaves das exchanges antes de iniciar!"
