# Guia de Integração - Bot de Arbitragem de Criptomoedas

## Visão Geral da Arquitetura

Este projeto está dividido em três camadas principais que se comunicam através de APIs padronizadas e eventos em tempo real:

### 1. **Frontend (Interface do Usuário)** - v0.dev
- Dashboard responsivo e intuitivo
- Visualizações em tempo real
- Configurações de usuário
- Histórico e análises

### 2. **Backend (Motor de Arbitragem)** - Usuário
- Detecção de oportunidades
- Execução de trades
- Conexão com exchanges
- Algoritmos de arbitragem

### 3. **Segurança e Controle** - Manus AI
- Autenticação e autorização
- Gerenciamento de chaves API
- Controle de modos operacionais
- Auditoria e logs

## Componentes de Integração

### API Client (`lib/integration/api-client.ts`)
Cliente unificado para comunicação HTTP entre as camadas.

\`\`\`typescript
import { apiClient } from '@/lib/integration/api-client'

// Exemplo de uso
const opportunities = await apiClient.scanOpportunities({
  pairs: ['BTC/USDT', 'ETH/USDT'],
  exchanges: ['binance', 'kraken'],
  minProfit: 0.5,
  maxSlippage: 1.0
})
\`\`\`

### WebSocket Client (`lib/integration/websocket-client.ts`)
Cliente para comunicação em tempo real.

\`\`\`typescript
import { wsClient } from '@/lib/integration/websocket-client'

// Conectar e subscrever a eventos
await wsClient.connect(authToken)
wsClient.subscribeToOpportunities(['BTC/USDT'], ['binance', 'kraken'])

// Escutar eventos
wsClient.on('opportunity_found', (opportunity) => {
  console.log('Nova oportunidade:', opportunity)
})
\`\`\`

### Event Bus (`lib/integration/event-bus.ts`)
Sistema de eventos para comunicação desacoplada.

\`\`\`typescript
import { eventBus } from '@/lib/integration/event-bus'

// Emitir eventos
eventBus.emitOpportunityFound(opportunity)

// Escutar eventos
const subscriptionId = eventBus.onOpportunityFound((opportunity) => {
  // Processar oportunidade
})

// Remover listener
eventBus.off('arbitrage:opportunity_found', subscriptionId)
\`\`\`

### Security Manager (`lib/integration/security-manager.ts`)
Gerenciamento de segurança e autenticação.

\`\`\`typescript
import { securityManager } from '@/lib/integration/security-manager'

// Login
const result = await securityManager.login({
  username: 'user',
  password: 'pass',
  twoFactorCode: '123456'
})

// Verificar permissões
if (securityManager.canExecuteTrades()) {
  // Executar trade
}

// Validar operação crítica
const validation = await securityManager.validateCriticalOperation({
  type: 'trade_execution',
  data: { opportunityId: 'abc123' }
})
\`\`\`

### Config Manager (`lib/integration/config-manager.ts`)
Gerenciamento centralizado de configurações.

\`\`\`typescript
import { configManager } from '@/lib/integration/config-manager'

// Carregar configuração
await configManager.loadConfig()

// Atualizar configurações de arbitragem
await configManager.updateArbitrageSettings({
  minProfitThreshold: 1.0,
  maxTradeAmount: 2000
})

// Escutar mudanças de configuração
eventBus.onConfigChange('arbitrage', (config) => {
  console.log('Configuração de arbitragem atualizada:', config)
})
\`\`\`

## Contratos de API

### Tipos Principais

\`\`\`typescript
// Oportunidade de arbitragem
interface ArbitrageOpportunity {
  id: string
  pair: string
  buyExchange: string
  sellExchange: string
  buyPrice: number
  sellPrice: number
  spreadPercentage: number
  estimatedProfit: number
  timestamp: string
  type: 'simple' | 'triangular' | 'cross-chain'
}

// Configuração do motor de arbitragem
interface ArbitrageEngineConfig {
  minProfitThreshold: number
  maxTradeAmount: number
  maxDailyLoss: number
  slippageTolerance: number
  enabledExchanges: string[]
  monitoredPairs: string[]
  arbitrageTypes: ('simple' | 'triangular' | 'cross-chain')[]
  riskLimits: RiskLimits
}

// Resultado de execução
interface ExecutionResponse {
  success: boolean
  executionId: string
  orders: OrderResult[]
  estimatedProfit: number
  actualProfit?: number
  fees: number
  error?: string
  warnings: string[]
}
\`\`\`

## Fluxo de Integração

### 1. Inicialização do Sistema

\`\`\`typescript
// 1. Carregar configurações
await configManager.loadConfig()

// 2. Inicializar segurança (se autenticado)
if (securityManager.isAuthenticated) {
  // 3. Conectar WebSocket
  await wsClient.connect(authToken)
  
  // 4. Subscrever a eventos essenciais
  wsClient.subscribeToSystemStatus()
}
\`\`\`

### 2. Detecção de Oportunidades

\`\`\`typescript
// Backend detecta oportunidade
const opportunity = {
  id: 'opp_123',
  pair: 'BTC/USDT',
  buyExchange: 'binance',
  sellExchange: 'kraken',
  spreadPercentage: 1.2,
  estimatedProfit: 50.0
}

// Enviar via WebSocket para Frontend
wsClient.emit('opportunity_found', opportunity)

// Frontend recebe e exibe
wsClient.on('opportunity_found', (opp) => {
  // Atualizar UI com nova oportunidade
  updateOpportunitiesDisplay(opp)
})
\`\`\`

### 3. Execução de Trade

\`\`\`typescript
// Frontend solicita execução
const executionRequest = {
  opportunityId: 'opp_123',
  mode: 'live', // ou 'simulation'
  userConfirmation: true
}

// Validar segurança
const validation = await securityManager.validateCriticalOperation({
  type: 'trade_execution',
  data: executionRequest
})

if (validation.allowed) {
  // Executar via API
  const result = await apiClient.executeArbitrage(executionRequest)
  
  // Notificar resultado
  eventBus.emitOpportunityExecuted(result)
}
\`\`\`

## Eventos WebSocket

### Eventos do Sistema

| Evento | Descrição | Dados |
|--------|-----------|-------|
| `opportunity_found` | Nova oportunidade detectada | `ArbitrageOpportunity` |
| `trade_executed` | Trade executado | `ExecutionResponse` |
| `system_status` | Status do sistema | `SystemHealthCheck` |
| `exchange_status` | Status de exchange | `ConnectionStatus` |
| `error` | Erro do sistema | `SystemError` |

### Subscrições

\`\`\`typescript
// Subscrever a oportunidades específicas
wsClient.subscribeToOpportunities(
  ['BTC/USDT', 'ETH/USDT'], // pares
  ['binance', 'kraken']     // exchanges
)

// Subscrever a status do sistema
wsClient.subscribeToSystemStatus()

// Subscrever a status de exchanges
wsClient.subscribeToExchangeStatus(['binance', 'kraken'])
\`\`\`

## Segurança

### Autenticação

\`\`\`typescript
// Login com 2FA
const authResult = await securityManager.login({
  username: 'trader',
  password: 'secure_password',
  twoFactorCode: '123456'
})

if (authResult.success) {
  // Usuário autenticado
  console.log('Logado como:', authResult.user?.username)
}
\`\`\`

### Permissões

\`\`\`typescript
// Verificar permissões específicas
const canTrade = securityManager.hasPermission('execute_trades')
const canConfig = securityManager.hasPermission('modify_config')

// Exigir permissão (lança erro se não tiver)
securityManager.requirePermission('execute_trades')
\`\`\`

### Operações Críticas

\`\`\`typescript
// Validar operação crítica (pode exigir confirmação do usuário)
const validation = await securityManager.validateCriticalOperation({
  type: 'mode_switch',
  data: { mode: 'live' },
  requiresConfirmation: true
})

if (!validation.allowed) {
  console.error('Operação negada:', validation.reason)
}
\`\`\`

## Configuração

### Carregar e Salvar

\`\`\`typescript
// Carregar todas as configurações
const config = await configManager.loadConfig()

// Atualizar seção específica
await configManager.updateArbitrageSettings({
  minProfitThreshold: 1.0,
  maxTradeAmount: 5000
})

// Salvar configuração completa
await configManager.saveConfig()
\`\`\`

### Validação

\`\`\`typescript
// Validar configuração de arbitragem
const validation = configManager.validateArbitrageConfig(config)

if (!validation.valid) {
  console.error('Configuração inválida:', validation.errors)
}
\`\`\`

## Tratamento de Erros

### Padrão de Resposta

\`\`\`typescript
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  requestId: string
}
\`\`\`

### Exemplo de Uso

\`\`\`typescript
try {
  const response = await apiClient.scanOpportunities(request)
  if (response.success) {
    // Processar dados
    console.log('Oportunidades:', response.data)
  } else {
    // Tratar erro
    console.error('Erro na API:', response.error)
  }
} catch (error) {
  // Tratar erro de rede/conexão
  console.error('Erro de conexão:', error)
}
\`\`\`

## Monitoramento

### Health Check

\`\`\`typescript
// Verificar saúde do sistema
const health = await apiClient.getSystemHealth()

console.log('Status do bot:', health.botStatus)
console.log('Conexões:', health.exchangeConnections)
console.log('Erros recentes:', health.errors)
\`\`\`

### Logs

\`\`\`typescript
// Buscar logs com filtros
const logs = await apiClient.getLogs({
  startDate: '2023-01-01',
  endDate: '2023-01-31',
  level: 'error'
})
\`\`\`

## Deployment

### Docker

\`\`\`bash
# Build da aplicação
docker build -t crypto-arbitrage-bot .

# Executar com docker-compose
docker-compose up -d
\`\`\`

### Variáveis de Ambiente

\`\`\`env
# API Configuration
API_BASE_URL=http://localhost:8080/api/v1
WS_URL=ws://localhost:8080/ws

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/arbitrage_bot

# External Services
TELEGRAM_BOT_TOKEN=your_telegram_token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
\`\`\`

## Próximos Passos

1. **Implementar Backend**: Desenvolver o motor de arbitragem usando os contratos definidos
2. **Configurar Segurança**: Implementar autenticação JWT + 2FA
3. **Adicionar Exchanges**: Implementar conectores para mais exchanges
4. **Testes**: Criar testes unitários e de integração
5. **Monitoramento**: Configurar logs e métricas em produção

## Suporte

Para dúvidas sobre a integração:
- Consulte os tipos TypeScript em `lib/integration/api-contracts.ts`
- Verifique os exemplos de uso nos componentes
- Teste as APIs usando o cliente unificado
