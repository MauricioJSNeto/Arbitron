#!/bin/bash

echo "🚀 Arbitron AWS EC2 Deployment Script"
echo "======================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   log_error "Este script não deve ser executado como root"
   exit 1
fi

# Atualizar sistema
log_info "Atualizando sistema Ubuntu..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
log_info "Instalando dependências básicas..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Docker
log_info "Instalando Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
log_info "Instalando Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Node.js (para desenvolvimento local se necessário)
log_info "Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Python e pip
log_info "Instalando Python..."
sudo apt install -y python3 python3-pip python3-venv

# Clonar repositório Arbitron
log_info "Clonando repositório Arbitron..."
cd /home/$USER
if [ -d "Arbitron" ]; then
    log_warning "Diretório Arbitron já existe. Removendo..."
    rm -rf Arbitron
fi

git clone https://github.com/MauricioJSNeto/Arbitron.git
cd Arbitron

# Criar arquivos de ambiente
log_info "Configurando arquivos de ambiente..."

# Gerar chaves seguras
JWT_SECRET=$(openssl rand -hex 32)
REFRESH_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Criar .env principal
cat > .env << EOF
# Arbitron - Production Environment
PROJECT_NAME=Arbitron
PROJECT_VERSION=1.0.0
NODE_ENV=production

# API Configuration
API_BASE_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000/api/v1
WS_URL=ws://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000/ws

# Security Configuration
JWT_SECRET=$JWT_SECRET
REFRESH_TOKEN_SECRET=$REFRESH_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Database Configuration
DATABASE_URL=postgresql://arbitron_user:$(openssl rand -hex 16)@postgres:5432/arbitron_db
REDIS_URL=redis://redis:6379

# Exchange API Keys (CONFIGURE MANUALMENTE)
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
KRAKEN_API_KEY=your_kraken_api_key
KRAKEN_SECRET_KEY=your_kraken_secret_key

# Monitoring
TELEGRAM_BOT_TOKEN=your_telegram_token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# Server Configuration
PORT=3000
HOST=0.0.0.0
EOF

# Criar .env para security-backend
mkdir -p security-backend
cat > security-backend/.env << EOF
# Arbitron Security Backend
PORT=3001
NODE_ENV=production

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=$REFRESH_SECRET
REFRESH_TOKEN_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Database
DATABASE_URL=postgresql://arbitron_user:$(openssl rand -hex 16)@postgres:5432/arbitron_security_db

# CORS
CORS_ORIGIN=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Configurar firewall
log_info "Configurando firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 8000
sudo ufw allow 3001
sudo ufw --force enable

# Configurar Docker Compose para produção
log_info "Configurando Docker Compose para produção..."
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  # Frontend (Next.js)
  frontend:
    build: 
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3001
      - NEXT_PUBLIC_ARBITRAGE_API_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000
      - NEXT_PUBLIC_WS_URL=ws://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000/ws
    depends_on:
      - security-backend
      - arbitrage-engine
    networks:
      - arbitron-network
    restart: unless-stopped

  # Security Backend
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
      - arbitron-network
    restart: unless-stopped

  # Arbitrage Engine
  arbitrage-engine:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - POSTGRES_URL=postgresql://arbitron_user:arbitron_pass@postgres:5432/arbitron_arbitrage_db
      - API_HOST=0.0.0.0
      - API_PORT=8000
    depends_on:
      - redis
      - postgres
    networks:
      - arbitron-network
    restart: unless-stopped

  # PostgreSQL Database
  postgres:
    image: postgres:13
    environment:
      - POSTGRES_USER=arbitron_user
      - POSTGRES_PASSWORD=arbitron_pass
      - POSTGRES_DB=arbitron_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - arbitron-network
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - arbitron-network
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - security-backend
      - arbitrage-engine
    networks:
      - arbitron-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  arbitron-network:
    driver: bridge
EOF

# Criar diretórios necessários
log_info "Criando diretórios necessários..."
mkdir -p logs ssl data/{postgres,redis}

# Configurar permissões
sudo chown -R $USER:$USER /home/$USER/Arbitron
chmod +x scripts/*.sh

# Instalar dependências Python localmente (para desenvolvimento)
log_info "Instalando dependências Python..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

log_success "Configuração inicial concluída!"

echo ""
echo "🔧 PRÓXIMOS PASSOS MANUAIS:"
echo "=========================="
echo "1. Configure suas chaves de API das exchanges em .env"
echo "2. Execute: newgrp docker (para aplicar permissões Docker)"
echo "3. Execute: docker-compose -f docker-compose.prod.yml up --build -d"
echo "4. Acesse: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo ""
echo "📋 URLS DE ACESSO:"
echo "=================="
echo "Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo "API Docs: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000/docs"
echo "Security: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3001/health"
echo ""
echo "🔐 CHAVES GERADAS:"
echo "=================="
echo "JWT_SECRET: $JWT_SECRET"
echo "REFRESH_SECRET: $REFRESH_SECRET"
echo "ENCRYPTION_KEY: $ENCRYPTION_KEY"
echo ""
log_success "Deploy script executado com sucesso!"
