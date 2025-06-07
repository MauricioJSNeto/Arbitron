#!/bin/bash

echo "🔑 Configurador de APIs das Exchanges"
echo "===================================="

# Função para configurar APIs de forma segura
configure_exchange_api() {
    local exchange=$1
    echo ""
    echo "📈 Configurando $exchange:"
    echo "========================"
    
    read -p "API Key para $exchange: " api_key
    read -s -p "Secret Key para $exchange: " secret_key
    echo ""
    
    # Atualizar .env
    sed -i "s/${exchange^^}_API_KEY=.*/${exchange^^}_API_KEY=$api_key/" .env
    sed -i "s/${exchange^^}_SECRET_KEY=.*/${exchange^^}_SECRET_KEY=$secret_key/" .env
    
    echo "✅ $exchange configurado!"
}

echo "Este script irá configurar suas chaves de API das exchanges."
echo "⚠️  IMPORTANTE: Use apenas chaves com permissões limitadas (somente leitura + trading)!"
echo ""

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado. Execute o setup primeiro!"
    exit 1
fi

# Configurar exchanges
echo "Quais exchanges você deseja configurar?"
echo "1) Binance"
echo "2) Kraken" 
echo "3) Ambas"
echo "4) Pular configuração"

read -p "Escolha (1-4): " choice

case $choice in
    1)
        configure_exchange_api "binance"
        ;;
    2)
        configure_exchange_api "kraken"
        ;;
    3)
        configure_exchange_api "binance"
        configure_exchange_api "kraken"
        ;;
    4)
        echo "⚠️  Configuração pulada. O bot rodará em modo simulação."
        ;;
    *)
        echo "❌ Opção inválida!"
        exit 1
        ;;
esac

echo ""
echo "🔧 Configurações de segurança:"
echo "============================="

# Configurar modo simulação
read -p "Iniciar em modo simulação? (s/n): " sim_mode
if [[ $sim_mode =~ ^[Ss]$ ]]; then
    sed -i "s/SIMULATION_MODE=.*/SIMULATION_MODE=true/" .env
    echo "✅ Modo simulação ativado (recomendado para testes)"
else
    sed -i "s/SIMULATION_MODE=.*/SIMULATION_MODE=false/" .env
    echo "⚠️  Modo real ativado - tenha cuidado!"
fi

# Configurar limites
read -p "Valor máximo por trade (USD) [100]: " max_trade
max_trade=${max_trade:-100}
sed -i "s/MAX_TRADE_AMOUNT=.*/MAX_TRADE_AMOUNT=$max_trade/" .env

read -p "Lucro mínimo para arbitragem (%) [0.5]: " min_profit
min_profit=${min_profit:-0.5}
sed -i "s/MIN_PROFIT_THRESHOLD=.*/MIN_PROFIT_THRESHOLD=$min_profit/" .env

echo ""
echo "✅ Configuração concluída!"
echo "🚀 Execute ./start.sh para iniciar o Arbitron"
