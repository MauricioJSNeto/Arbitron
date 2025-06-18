# Projeto Arbitron - Implementação de Melhorias

## Descrição

Este projeto implementa melhorias significativas no sistema de arbitragem de criptomoedas Arbitron, seguindo as melhores práticas de desenvolvimento de software e organizando o trabalho em áreas especializadas.

## Instalação

### Pré-requisitos

- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)
- Git

### Passos de Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/arbitron.git
   cd arbitron
   ```

2. **Crie um ambiente virtual:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # ou
   venv\Scripts\activate  # Windows
   ```

3. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

5. **Execute as migrações do banco de dados:**
   ```bash
   python src/database/setup.py
   ```

## Exemplos de Uso

### Exemplo Básico - Detecção de Arbitragem

```python
from src.arbitrage import ArbitrageEngine
from src.api_manager import APIManager, BinanceAPI
from decimal import Decimal

# Configurar APIs
api_manager = APIManager()
api_manager.add_exchange('binance', BinanceAPI())

# Configurar motor de arbitragem
engine = ArbitrageEngine(['binance'], min_profit=Decimal('1.0'))

# Buscar oportunidades
opportunities = engine.find_opportunities('BTC/USDT')

for opp in opportunities:
    print(f"Oportunidade: {opp.symbol}")
    print(f"Comprar em: {opp.exchange_buy} por ${opp.buy_price}")
    print(f"Vender em: {opp.exchange_sell} por ${opp.sell_price}")
    print(f"Lucro: {opp.profit_percentage}%")
```

### Exemplo - Sistema de Notificações

```python
from src.notifications import NotificationManager, TelegramNotificationProvider
from src.config import settings

# Configurar notificações
notification_manager = NotificationManager()

if settings.telegram_bot_token:
    telegram_provider = TelegramNotificationProvider(
        settings.telegram_bot_token,
        settings.telegram_chat_id
    )
    notification_manager.add_provider(telegram_provider)

# Enviar alerta de arbitragem
opportunity_data = {
    'symbol': 'BTC/USDT',
    'profit_percentage': 1.5,
    'exchange_buy': 'binance',
    'exchange_sell': 'coinbase',
    'buy_price': 50000.0,
    'sell_price': 50750.0,
    'timestamp': '2023-01-01 12:00:00'
}

notification_manager.send_arbitrage_alert(opportunity_data)
```

### Exemplo - Painel Web

```python
# Executar o painel web
cd arbitron_web_panel
source venv/bin/activate
python src/main.py

# Acesse http://localhost:5000 no seu navegador
```

## Estrutura do Projeto

```
arbitron_project/
├── src/                          # Código fonte principal
│   ├── arbitrage.py             # Motor de arbitragem
│   ├── api_manager.py           # Gerenciamento de APIs
│   ├── config.py                # Configurações e segredos
│   ├── notifications.py         # Sistema de notificações
│   └── performance.py           # Otimização e caching
├── tests/                       # Testes automatizados
│   ├── test_arbitrage.py        # Testes do motor de arbitragem
│   ├── test_api_manager.py      # Testes das APIs
│   └── test_integration.py      # Testes de integração
├── docs/                        # Documentação
│   ├── cronograma.md            # Cronograma do projeto
│   ├── cronograma.csv           # Planilha de tarefas
│   └── sistema_acompanhamento.md # Sistema de acompanhamento
├── arbitron_web_panel/          # Painel web Flask
├── config/                      # Arquivos de configuração
├── .env.example                 # Exemplo de variáveis de ambiente
├── requirements.txt             # Dependências Python
├── README.md                    # Este arquivo
└── CONTRIBUTING.md              # Guia de contribuição
```

## Configuração

### Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure as seguintes variáveis:

```bash
# APIs das exchanges
BINANCE_API_KEY=sua_chave_binance
BINANCE_API_SECRET=seu_segredo_binance

# Configurações de arbitragem
MIN_PROFIT_PERCENTAGE=1.0
MAX_TRADE_AMOUNT=1000.0

# Notificações Telegram
TELEGRAM_BOT_TOKEN=seu_token_telegram
TELEGRAM_CHAT_ID=seu_chat_id

# Configurações de email
SMTP_SERVER=smtp.gmail.com
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_email
```

## Testes

### Executar Todos os Testes

```bash
python -m pytest tests/ -v
```

### Executar Testes com Cobertura

```bash
python -m pytest tests/ --cov=src --cov-report=html
```

### Executar Testes Específicos

```bash
# Testes de arbitragem
python -m pytest tests/test_arbitrage.py -v

# Testes de integração
python -m pytest tests/test_integration.py -v
```

## Monitoramento e Performance

### Métricas de Performance

O sistema inclui monitoramento automático de performance:

```python
from src.performance import PerformanceMonitor

monitor = PerformanceMonitor()

# Obter relatório de performance
report = monitor.get_performance_report()
print(report)
```

### Cache

O sistema utiliza cache TTL para otimizar consultas:

```python
from src.performance import CacheManager

cache = CacheManager()

# Verificar estatísticas do cache
stats = cache.get_cache_stats()
print(f"Cache hits: {stats['price_cache']['hits']}")
```

## Segurança

### Melhores Práticas Implementadas

1. **Gerenciamento de Segredos:** Todas as chaves API são armazenadas em variáveis de ambiente
2. **Validação de Entrada:** Uso do Pydantic para validação rigorosa de dados
3. **Logging de Segurança:** Registro de todas as operações críticas
4. **Sanitização:** Limpeza de dados de entrada para prevenir ataques

### Auditoria de Segurança

```bash
# Verificar vulnerabilidades conhecidas
pip audit

# Análise estática de código
bandit -r src/
```

## Contribuição

Consulte o arquivo [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes detalhadas sobre como contribuir para o projeto.

## Licença

Este projeto está licenciado sob a Licença MIT. Consulte o arquivo LICENSE para mais detalhes.

## Suporte

Para suporte técnico ou dúvidas:

1. Abra uma issue no GitHub
2. Consulte a documentação em `docs/`
3. Entre em contato com a equipe de desenvolvimento

## Roadmap

### Versão 2.0 (Planejada)
- [ ] Suporte a mais exchanges
- [ ] Machine Learning para predição de oportunidades
- [ ] API REST completa
- [ ] Dashboard em tempo real
- [ ] Execução automática de trades

### Versão 1.1 (Em desenvolvimento)
- [x] Refatoração modular
- [x] Sistema de notificações
- [x] Painel web básico
- [x] Testes automatizados
- [x] Otimização de performance

## Changelog

### v1.0.0 (Atual)
- Implementação inicial das melhorias
- Refatoração completa do código
- Sistema de notificações
- Painel web Flask
- Testes automatizados
- Documentação completa

