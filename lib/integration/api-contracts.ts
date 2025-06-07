// Contratos de API padronizados para comunicação entre camadas
// Define tipos, interfaces e estruturas de dados compartilhadas

// ============================================================================
// TIPOS BASE
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface FilterOptions {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  status?: string
  exchange?: string
  pair?: string
  [key: string]: any
}

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================

export interface AuthRequest {
  email: string
  password: string
  twoFactorCode?: string
}

export interface AuthResponse {
  token: string
  refreshToken?: string
  user: {
    id: string
    email: string
    role: string
    permissions: string[]
  }
  expiresIn: number
}

// ============================================================================
// ARBITRAGEM
// ============================================================================

export interface ArbitrageOpportunity {
  id: string
  pair: string
  buyExchange: string
  sellExchange: string
  buyPrice: number
  sellPrice: number
  spreadPercentage: number
  estimatedProfit: number
  timestamp: string
  type: "simple" | "triangular" | "cross-chain"
  volume?: number
  confidence?: number
}

export interface ArbitrageEngineConfig {
  enabled: boolean
  minProfitThreshold: number
  maxTradeAmount: number
  enabledExchanges: string[]
  enabledPairs: string[]
  riskSettings: {
    maxSlippage: number
    maxLatency: number
    minLiquidity: number
  }
}

export interface OpportunityDetectionRequest {
  pairs: string[]
  exchanges: string[]
  minProfit?: number
  maxLatency?: number
}

export interface OpportunityDetectionResponse {
  opportunities: ArbitrageOpportunity[]
  scanTime: number
  exchangesScanned: string[]
  pairsScanned: string[]
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

export interface ExecutionRequest {
  opportunityId: string
  amount: number
  slippageTolerance: number
  dryRun?: boolean
}

export interface ExecutionResponse {
  id: string
  opportunityId: string
  status: "pending" | "executing" | "completed" | "failed" | "cancelled"
  buyOrder?: {
    id: string
    exchange: string
    pair: string
    amount: number
    price: number
    status: string
  }
  sellOrder?: {
    id: string
    exchange: string
    pair: string
    amount: number
    price: number
    status: string
  }
  actualProfit?: number
  fees: {
    buy: number
    sell: number
    network?: number
  }
  executionTime: number
  timestamp: string
}

// ============================================================================
// DADOS DE MERCADO
// ============================================================================

export interface MarketDataRequest {
  exchanges: string[]
  pairs: string[]
  depth?: number
}

export interface MarketDataResponse {
  data: Record<
    string,
    Record<
      string,
      {
        bid: number
        ask: number
        volume: number
        timestamp: string
      }
    >
  >
  timestamp: string
}

// ============================================================================
// SISTEMA
// ============================================================================

export interface SystemHealthCheck {
  status: "healthy" | "degraded" | "unhealthy"
  uptime: number
  version: string
  exchanges: Record<string, ConnectionStatus>
  performance: {
    avgResponseTime: number
    successRate: number
    errorRate: number
  }
  resources: {
    cpu: number
    memory: number
    disk: number
  }
  timestamp: string
}

export interface ConnectionStatus {
  connected: boolean
  latency: number
  lastCheck: string
  errors: number
}

export interface SystemError {
  id: string
  level: "info" | "warning" | "error" | "critical"
  message: string
  source: string
  timestamp: string
  details?: any
}

// ============================================================================
// CONFIGURAÇÃO DE EXCHANGES
// ============================================================================

export interface ExchangeConfig {
  id: string
  name: string
  type: "CEX" | "DEX"
  enabled: boolean
  connected: boolean
  apiKey?: string
  apiSecret?: string
  passphrase?: string
  testnet?: boolean
  walletPrivateKey?: string
  walletAddress?: string
  rateLimits?: {
    requests: number
    window: number
  }
}

// ============================================================================
// WEBSOCKET EVENTS
// ============================================================================

export interface WebSocketEvent {
  type: string
  data: any
  timestamp: string
}

export interface OpportunityFoundEvent extends WebSocketEvent {
  type: "opportunity_found"
  data: ArbitrageOpportunity
}

export interface TradeExecutedEvent extends WebSocketEvent {
  type: "trade_executed"
  data: ExecutionResponse
}

export interface SystemStatusEvent extends WebSocketEvent {
  type: "system_status"
  data: SystemHealthCheck
}

export interface ExchangeStatusEvent extends WebSocketEvent {
  type: "exchange_status"
  data: {
    exchange: string
    status: ConnectionStatus
  }
}

export interface ErrorEvent extends WebSocketEvent {
  type: "error"
  data: SystemError
}

// ============================================================================
// NOTIFICAÇÕES
// ============================================================================

export interface NotificationRequest {
  type: "email" | "sms" | "webhook" | "telegram"
  recipient: string
  subject?: string
  message: string
  priority: "low" | "medium" | "high" | "critical"
  data?: any
}

export interface NotificationResponse {
  id: string
  status: "sent" | "failed" | "pending"
  timestamp: string
}

// ============================================================================
// HISTÓRICO E LOGS
// ============================================================================

export interface Trade {
  id: string
  timestamp: string
  pair: string
  type: "simple" | "triangular" | "cross-chain"
  buyExchange: string
  sellExchange: string
  amount: number
  profit: number
  status: "completed" | "failed" | "partial"
}

export interface Alert {
  id: string
  timestamp: string
  severity: "info" | "warning" | "error" | "critical"
  title: string
  message: string
  source: string
  acknowledged?: boolean
}
