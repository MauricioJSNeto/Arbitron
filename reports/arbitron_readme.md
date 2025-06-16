# GitHub - MauricioJSNeto/Arbitron

Bem-vindo ao **Arbitron**, um bot avançado de arbitragem de criptomoedas projetado para identificar e executar oportunidades lucrativas em exchanges centralizadas (CEX) e descentralizadas (DEX). Este projeto implementa um motor de arbitragem robusto, com suporte a estratégias simples e triangulares, integração com APIs de exchanges via CCXT, e uma API RESTful para monitoramento e controle.

O bot monitora preços em tempo real, calcula lucros potenciais considerando taxas, e executa trades automaticamente (em modo real ou simulado). Ele é projetado para baixa latência, segurança e extensibilidade, com uma arquitetura modular que suporta CEXs (Binance, Kraken, etc.), DEXs (Uniswap, PancakeSwap, etc.), e futuramente arbitragem cross-chain.

*   **Arbitragem Simples**: Detecta oportunidades entre exchanges para o mesmo par (e.g., BTC/USDT).
*   **Arbitragem Triangular**: Identifica lucros dentro de uma exchange usando três pares (e.g., BTC/ETH, ETH/USDT, USDT/BTC).
*   **Integração com CCXT**: Conexão com múltiplas CEXs para dados de mercado em tempo real.
*   **API RESTful**: Endpoints para escanear oportunidades (`/api/v1/arbitrage/scan`, `/api/v1/arbitrage/scan_triangular`).
*   **Gerenciamento de Risco**: Configuração de limiar mínimo de lucro e taxas de exchanges.
*   **Containerização**: Suporte a Docker e Docker Compose para implantação.
*   **Logging**: Registro detalhado de operações e erros.

*   **Linguagem**: Python 3.9
*   **Bibliotecas**: FastAPI, CCXT, Pydantic, Redis, Psycopg2
*   **Containerização**: Docker, Docker Compose
*   **Banco de Dados**: PostgreSQL (persistência), Redis (cache)
*   **Configuração**: YAML

\`\`\`plaintext Cripto-bot-arbitragem/ ├── Dockerfile ├── docker-compose.yml ├── requirements.txt ├── scripts/ │ ├── arbitrage\_engine.py # Lógica principal de arbitragem │ ├── connectors/ │ │ ├── cex.py # Conector para exchanges CEX │ ├── execution/ │ │ ├── engine.py # Motor de execução de trades ├── api/ │ ├── main.py # Aplicação FastAPI │ ├── models.py # Modelos Pydantic para validação ├── config/ │ ├── settings.yaml # Configurações do bot \`\`\`

*   **Docker** e **Docker Compose** instalados
*   Python 3.9 (opcional, se rodar localmente sem Docker)
*   Chaves API de exchanges (opcional, para execução real)
*   Git instalado para clonar o repositório

1.  **Clone o repositório**: \`\`\`bash git clone [https://github.com/MauricioJSNeto/Arbitron.git]() cd Arbitron \`\`\`
    
2.  **Configure as variáveis de ambiente** (se necessário):
    
    *   Edite `config/settings.yaml` para definir pares, exchanges, e conexões com Redis/PostgreSQL.
    *   Para chaves API, configure-as de forma segura (futuramente via HashiCorp Vault ou variáveis de ambiente).
3.  **Construa e inicie os contêineres**: \`\`\`bash docker-compose up --build \`\`\`
    
    *   Isso inicia o bot, Redis, e PostgreSQL.
    *   A API estará disponível em `http://localhost:8000`.
4.  **Acesse a documentação da API**:
    
    *   Abra `http://localhost:8000/docs` no navegador para testar os endpoints.

*   O bot inicia automaticamente com `docker-compose up`.
*   Para parar, use `Ctrl+C` ou: \`\`\`bash docker-compose down \`\`\`

*   **Escanear arbitragem simples**: \`\`\`bash curl -X POST "[http://localhost:8000/api/v1/arbitrage/scan]()"  
    \-H "Content-Type: application/json"  
    \-d \'{"pair": "BTC/USDT", "exchanges": \["binance", "kraken"\], "min\_profit": 0.5}\' \`\`\`
*   **Escanear arbitragem triangular**: \`\`\`bash curl -X POST "[http://localhost:8000/api/v1/arbitrage/scan\_triangular]()"  
    \-H "Content-Type: application/json"  
    \-d \'{"exchange": "binance"}\' \`\`\`

Edite `config/settings.yaml` para ajustar:

*   `min_profit`: Limiar mínimo de lucro (em %).
*   `pairs`: Pares de moedas a monitorar (e.g., BTC/USDT, ETH/USDT).
*   `exchanges`: Exchanges a usar (e.g., binance, kraken).
*   Conexões com banco de dados e Redis.

### Adicionando Novas Funcionalidades

*   **Novas Exchanges**: Atualize `scripts/connectors/cex.py` para suportar novas CEXs via CCXT.
*   **Arbitragem Cross-Chain**: Implemente em `scripts/arbitrage_engine.py` usando Web3.py e APIs de pontes.
*   **WebSocket**: Adicione suporte em `scripts/connectors/cex.py` para streams de dados em tempo real.

### Executando Localmente (Sem Docker)

1.  Instale dependências: \`\`\`bash pip install -r requirements.txt \`\`\`
2.  Inicie a API: \`\`\`bash uvicorn api.main:app --host 0.0.0.0 --port 8000 \`\`\`

*   Adicione testes unitários em um diretório `tests/` (futuro).
*   Execute com: \`\`\`bash pytest \`\`\`

*   **Chaves API**: Configure-as com permissões mínimas (leitura/negociação, sem saques).
*   **Segredos**: Use um gerenciador de segredos (e.g., HashiCorp Vault) em produção.
*   **Logs**: Evite registrar informações sensíveis.
*   **2FA**: Planeje integrar autenticação de dois fatores no painel web (futuro).

*    Suporte a DEXs (Uniswap, PancakeSwap) via Web3.py
*    Arbitragem cross-chain com pontes
*    Servidor WebSocket para dados em tempo real
*    Painel web com React para monitoramento
*    Integração com IA/ML para ranking de oportunidades
*    Backtesting com dados históricos

Contribuições são bem-vindas! Siga estas etapas:

1.  Fork o repositório.
2.  Crie uma branch (`git checkout -b feature/nova-funcionalidade`).
3.  Commit suas mudanças (`git commit -m "Adiciona nova funcionalidade"`).
4.  Push para a branch (`git push origin feature/nova-funcionalidade`).
5.  Abra um Pull Request.

Este projeto está licenciado sob a [MIT License]().

Para dúvidas ou sugestões, contate [MauricioJSNeto]().
