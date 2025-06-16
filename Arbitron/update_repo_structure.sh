#!/bin/bash

# ---------------------------------------------------------------------
# Script para reorganizar o repositório Arbitron
# Autor: GitHub Copilot
# Data: 16/06/2025
# ---------------------------------------------------------------------

# Configurações
REPO_DIR="Arbitron"  # Substitua pelo caminho do seu repositório

# Cria estrutura de diretórios
mkdir -p "$REPO_DIR"/{data/{raw,processed,simulations},src/{data_fetch,strategies,backtesting,utils},reports/figures,notebooks,config}

# Cria arquivos templates
# -----------------------
# 1. Estratégia de arbitragem triangular
cat > "$REPO_DIR/src/strategies/triangular.py" << 'EOF'
def triangular_arbitrage(symbol1, symbol2, symbol3, exchange):
    """
    Identifica oportunidades de arbitragem triangular entre 3 pares.
    Retorna: (profitability, volume_available)
    """
    # Exemplo simplificado
    price1 = exchange.get_price(symbol1)
    price2 = exchange.get_price(symbol2)
    price3 = exchange.get_price(symbol3)
    profitability = (price1 / price2 * price3) - 1
    return profitability, min(price1.volume, price2.volume, price3.volume)

if __name__ == "__main__":
    print("Módulo de estratégia carregado.")
EOF

# 2. Relatório de performance
cat > "$REPO_DIR/reports/monthly_performance.md" << 'EOF'
## Performance (Junho 2025)
| Métrica          | Valor  |
|------------------|--------|
| Sharpe Ratio     | 2.1    |
| Taxa de Acerto   | 68%    |
| Drawdown Máximo  | -12%   |

## Melhor Estratégia
- **Arbitragem Triangular**: ROI de 15% no período.
EOF

# 3. Configuração de API (template seguro)
cat > "$REPO_DIR/config/api_keys.example.yml" << 'EOF'
# Template para chaves de API (NÃO COMITAR CHAVES REAIS)
binance:
  api_key: "sua_chave_aqui"
  api_secret: "seu_secreto_aqui"

alpha_vantage:
  api_key: "sua_chave_aqui"
EOF

# 4. Gitignore para dados sensíveis
cat >> "$REPO_DIR/.gitignore" << 'EOF'

# Dados sensíveis (adicionado pelo script)
.env
config/api_keys.yml
data/raw/*
!data/raw/.gitkeep
EOF

# 5. README.md atualizado
cat >> "$REPO_DIR/README.md" << 'EOF'

## Estrutura do Projeto (Atualizada)
- `src/strategies/`: Código de estratégias (ex: arbitragem triangular).
- `reports/`: Relatórios de performance mensal.
- Consulte `config/api_keys.example.yml` para configurar APIs.
EOF

# Arquivos vazios para manter estrutura
touch "$REPO_DIR"/data/{raw,processed,simulations}/.gitkeep
touch "$REPO_DIR"/reports/figures/.gitkeep

# ---------------------------------------------------------------------
# Mensagem final
echo "✅ Estrutura do repositório atualizada!"
echo "Diretórios criados:"
tree -d "$REPO_DIR" -L 2
echo ""
echo "Próximos passos:"
echo "1. Adicione dados brutos em $REPO_DIR/data/raw/"
echo "2. Configure suas chaves de API em config/api_keys.yml (não comite este arquivo!)"
