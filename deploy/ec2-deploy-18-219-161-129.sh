#!/bin/bash

echo "🚀 Arbitron Deploy - EC2: 18.219.161.129"
echo "========================================"

# Definir IP público
PUBLIC_IP="18.219.161.129"

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

log_info "Configurando Arbitron para IP: $PUBLIC_IP"

# Atualizar sistema
log_info "Atualizando sistema Ubuntu..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências
log_info "Instalando dependências essenciais..."
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
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configurar firewall
log_info "Configurando firewall UFW..."
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 3001/tcp
sudo ufw --force enable

# Clonar repositório Arbitron
log_info "Clonando repositório Arbitron..."
cd /home/$USER
rm -rf Arbitron
git clone https://github.com/MauricioJSNeto/Arbitron.git
cd Arbitron

# Gerar chaves de segurança
log_info "Gerando chaves de segurança..."
JWT_SECRET=$(openssl rand -hex 32)
REFRESH_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Criar arquivo .env principal
log_info "Configurando variáveis de ambiente..."
cat > .env << EOF
# Arbitron - AWS EC2 Configuration
# IP: 18.219.161.129
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

# Configurações do bot
MIN_PROFIT_THRESHOLD=0.5
MAX_TRADE_AMOUNT=100
SIMULATION_MODE=true

# APIs das Exchanges (CONFIGURE SUAS CHAVES REAIS)
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_SECRET_KEY=your_binance_secret_key_here
KRAKEN_API_KEY=your_kraken_api_key_here
KRAKEN_SECRET_KEY=your_kraken_secret_key_here

# Configurações de email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EOF

# Criar .env para security-backend
log_info "Configurando security backend..."
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

# Criar docker-compose otimizado para EC2
log_info "Criando configuração Docker Compose..."
cat > docker-compose.prod.yml << EOF
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
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

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
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

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
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U arbitron_user -d arbitron_db"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    networks:
      - arbitron-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:

networks:
  arbitron-net:
    driver: bridge
EOF

# Criar script de inicialização
log_info "Criando scripts de controle..."
cat > start-arbitron.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando Arbitron - IP: 18.219.161.129"
echo "=========================================="

# Aplicar permissões Docker (necessário após instalação)
sudo systemctl start docker
sudo systemctl enable docker

# Parar containers existentes
docker-compose -f docker-compose.prod.yml down

# Limpar sistema Docker
docker system prune -f

# Construir e iniciar serviços
echo "🔨 Construindo containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Iniciando serviços..."
docker-compose -f docker-compose.prod.yml up -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização dos serviços..."
sleep 60

# Verificar status
echo "🔍 Verificando status dos serviços..."

if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend: http://18.219.161.129:3000"
else
    echo "❌ Frontend não está respondendo"
fi

if curl -f -s http://localhost:8000/health > /dev/null; then
    echo "✅ API: http://18.219.161.129:8000/docs"
else
    echo "❌ API não está respondendo"
fi

if curl -f -s http://localhost:3001/health > /dev/null; then
    echo "✅ Security: http://18.219.161.129:3001/health"
else
    echo "❌ Security Backend não está respondendo"
fi

echo ""
echo "🎉 Arbitron está rodando!"
echo "========================"
echo "📊 Dashboard: http://18.219.161.129:3000"
echo "📚 API Docs: http://18.219.161.129:8000/docs"
echo "🔐 Security: http://18.219.161.129:3001/health"
echo ""
echo "📋 Comandos úteis:"
echo "- Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "- Status: docker-compose -f docker-compose.prod.yml ps"
echo "- Parar: docker-compose -f docker-compose.prod.yml down"
EOF

chmod +x start-arbitron.sh

# Criar script de monitoramento
cat > monitor.sh << 'EOF'
#!/bin/bash

clear
echo "📊 Arbitron System Monitor - 18.219.161.129"
echo "==========================================="
echo "Timestamp: $(date)"
echo ""

# Status dos containers
echo "🐳 Docker Containers:"
echo "===================="
docker-compose -f docker-compose.prod.yml ps
echo ""

# Status dos serviços
echo "🌐 Service Health Check:"
echo "======================="

if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend: http://18.219.161.129:3000 - ONLINE"
else
    echo "❌ Frontend: OFFLINE"
fi

if curl -f -s http://localhost:8000/health > /dev/null; then
    echo "✅ API Engine: http://18.219.161.129:8000 - ONLINE"
else
    echo "❌ API Engine: OFFLINE"
fi

if curl -f -s http://localhost:3001/health > /dev/null; then
    echo "✅ Security Backend: http://18.219.161.129:3001 - ONLINE"
else
    echo "❌ Security Backend: OFFLINE"
fi

# Verificar Redis
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis Cache: ONLINE"
else
    echo "❌ Redis Cache: OFFLINE"
fi

# Verificar PostgreSQL
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U arbitron_user > /dev/null 2>&1; then
    echo "✅ PostgreSQL: ONLINE"
else
    echo "❌ PostgreSQL: OFFLINE"
fi

echo ""
echo "💻 System Resources:"
echo "==================="
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2 " (" $5 ")"}')"
echo "Disk Usage: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"
echo "Docker Images: $(docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | wc -l) images"

echo ""
echo "🔗 Quick Access URLs:"
echo "===================="
echo "Dashboard: http://18.219.161.129:3000"
echo "API Docs: http://18.219.161.129:8000/docs"
echo "Security: http://18.219.161.129:3001/health"
EOF

chmod +x monitor.sh

# Criar script de configuração de APIs
cat > configure-apis.sh << 'EOF'
#!/bin/bash

echo "🔑 Configurador de APIs - Arbitron"
echo "=================================="
echo ""

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

echo "Este script irá configurar suas chaves de API das exchanges."
echo "⚠️  IMPORTANTE: Use apenas chaves com permissões limitadas!"
echo "   - Somente leitura de dados de mercado"
echo "   - Trading (se necessário)"
echo "   - NUNCA permissões de saque/withdraw"
echo ""

# Função para configurar exchange
configure_exchange() {
    local exchange=$1
    local exchange_upper=$(echo $exchange | tr '[:lower:]' '[:upper:]')
    
    echo "📈 Configurando $exchange:"
    echo "========================"
    
    read -p "API Key para $exchange: " api_key
    if [ -z "$api_key" ]; then
        echo "⚠️  API Key vazia, pulando $exchange..."
        return
    fi
    
    read -s -p "Secret Key para $exchange: " secret_key
    echo ""
    
    if [ -z "$secret_key" ]; then
        echo "⚠️  Secret Key vazia, pulando $exchange..."
        return
    fi
    
    # Atualizar .env
    sed -i "s/${exchange_upper}_API_KEY=.*/${exchange_upper}_API_KEY=$api_key/" .env
    sed -i "s/${exchange_upper}_SECRET_KEY=.*/${exchange_upper}_SECRET_KEY=$secret_key/" .env
    
    echo "✅ $exchange configurado com sucesso!"
    echo ""
}

# Menu de configuração
echo "Quais exchanges você deseja configurar?"
echo "1) Binance"
echo "2) Kraken"
echo "3) Ambas"
echo "4) Pular (manter modo simulação)"
echo ""

read -p "Escolha uma opção (1-4): " choice

case $choice in
    1)
        configure_exchange "binance"
        ;;
    2)
        configure_exchange "kraken"
        ;;
    3)
        configure_exchange "binance"
        configure_exchange "kraken"
        ;;
    4)
        echo "⚠️  Configuração de APIs pulada."
        echo "   O bot continuará em modo simulação."
        ;;
    *)
        echo "❌ Opção inválida!"
        exit 1
        ;;
esac

# Configurações de segurança
echo "🔧 Configurações de Segurança:"
echo "=============================="

# Modo simulação
read -p "Manter modo simulação ativado? (s/n) [s]: " sim_mode
sim_mode=${sim_mode:-s}

if [[ $sim_mode =~ ^[Ss]$ ]]; then
    sed -i "s/SIMULATION_MODE=.*/SIMULATION_MODE=true/" .env
    echo "✅ Modo simulação mantido (RECOMENDADO para testes)"
else
    echo "⚠️  ATENÇÃO: Você está prestes a ativar o modo REAL!"
    echo "   Isso significa que o bot fará trades reais com dinheiro real."
    read -p "Tem certeza? Digite 'CONFIRMO' para continuar: " confirm
    
    if [ "$confirm" = "CONFIRMO" ]; then
        sed -i "s/SIMULATION_MODE=.*/SIMULATION_MODE=false/" .env
        echo "🚨 Modo REAL ativado - USE COM EXTREMA CAUTELA!"
    else
        echo "✅ Modo simulação mantido por segurança."
    fi
fi

# Configurar limites
echo ""
read -p "Valor máximo por trade em USD [100]: " max_trade
max_trade=${max_trade:-100}
sed -i "s/MAX_TRADE_AMOUNT=.*/MAX_TRADE_AMOUNT=$max_trade/" .env

read -p "Lucro mínimo para arbitragem em % [0.5]: " min_profit
min_profit=${min_profit:-0.5}
sed -i "s/MIN_PROFIT_THRESHOLD=.*/MIN_PROFIT_THRESHOLD=$min_profit/" .env

echo ""
echo "✅ Configuração concluída!"
echo "🔄 Reinicie o Arbitron para aplicar as mudanças:"
echo "   ./start-arbitron.sh"
EOF

chmod +x configure-apis.sh

# Configurar permissões
sudo chown -R $USER:$USER /home/$USER/Arbitron

log_success "Setup concluído com sucesso!"
echo ""
echo "🎯 ARBITRON CONFIGURADO - IP: 18.219.161.129"
echo "============================================"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Configure suas chaves de API: ./configure-apis.sh"
echo "2. Inicie o Arbitron: ./start-arbitron.sh"
echo "3. Monitore o sistema: ./monitor.sh"
echo ""
echo "🔗 URLs DE ACESSO:"
echo "=================="
echo "📊 Dashboard: http://18.219.161.129:3000"
echo "📚 API Docs: http://18.219.161.129:8000/docs"
echo "🔐 Security: http://18.219.161.129:3001/health"
echo ""
echo "🔐 INFORMAÇÕES DE SEGURANÇA (SALVE EM LOCAL SEGURO):"
echo "=================================================="
echo "JWT Secret: $JWT_SECRET"
echo "DB Password: $DB_PASSWORD"
echo ""
log_warning "IMPORTANTE: Configure as chaves das exchanges antes de usar em produção!"
log_warning "O sistema iniciará em MODO SIMULAÇÃO por segurança."
