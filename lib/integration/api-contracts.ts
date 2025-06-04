// Contratos de API para integração entre as três camadas
// Define interfaces padronizadas para comunicação entre Frontend, Backend e Segurança

// ============================================================================
// CONTRATOS DE AUTENTICAÇÃO E SEGURANÇA (Manus AI Layer)
// ============================================================================

export interface AuthRequest {
  username: string
  password: string
  twoFactorCode?: string
}

export interface AuthResponse {
  success: boolean
  token?: string
  refreshToken?: string
  user?: UserProfile
  requiresTwoFactor?: boolean
  error?: string
}

export interface UserProfile {
  id: string
  username: string
  email: string
  role: "admin" | "trader" | "viewer"
  twoFactorEnabled: boolean
  lastLogin: string
  permissions: string[]
}

export interface SecureCredentials {
  id: string
  exchangeId: string
  encryptedApiKey: string
  encryptedApiSecret: string
  encryptedPassphrase?: string
  permissions: string[]
  isActive: boolean
  lastValidated: string
  createdAt: string
}

// ============================================================================
// CONTRATOS DO MOTOR DE ARBITRAGEM (User Layer)
// ============================================================================

export interface ArbitrageEngineConfig {
  minProfitThreshold: number // %
  maxTradeAmount: number // USD
  maxDailyLoss: number // USD
  slippageTolerance: number // %
  enabledExchanges: string[]
  monitoredPairs: string[]
  arbitrageTypes: ("simple" | "triangular" | "cross-chain")[]
  riskLimits: RiskLimits
}

export interface RiskLimits {
  maxPositionSize: number
  maxDailyTrades: number
  stopLossPercentage: number
  maxConcurrentTrades: number
  blacklistedTokens: string[]
  whitelistedTokens: string[]
}

export interface OpportunityDetectionRequest {
  pairs: string[]
  exchanges: string[]
  minProfit: number
  maxSlippage: number
}

export interface ArbitrageOpportunity {
  id: string
  type: "simple" | "triangular" | "cross-chain"
  exchanges: string[]
  pairs: string[]
  profit: number
  volume: number
  timestamp: string
  details: any
}

export interface OpportunityDetectionResponse {
  opportunities: ArbitrageOpportunity[]
  scanTime: number
  exchangesScanned: string[]
  totalPairsAnalyzed: number
}

export interface ExecutionRequest {
  opportunityId: string
  mode: "simulation" | "live"
  userConfirmation: boolean
  riskOverride?: boolean
}

export interface ExecutionResponse {
  success: boolean
  executionId: string
  orders: OrderResult[]
  estimatedProfit: number
  actualProfit?: number
  fees: number
  error?: string
  warnings: string[]
}

export interface OrderResult {
  orderId: string
  exchange: string
  pair: string
  side: "buy" | "sell"
  amount: number
  price: number
  status: "pending" | "filled" | "partial" | "cancelled" | "failed"
  timestamp: string
}

// ============================================================================
// CONTRATOS DE MONITORAMENTO E DADOS (Shared)
// ============================================================================

export interface MarketDataRequest {
  exchanges: string[]
  pairs: string[]
  includeOrderBook: boolean
  includeVolume: boolean
}

export interface MarketDataResponse {
  data: Record<string, ExchangeMarketData>
  timestamp: string
  latency: Record<string, number>
}

export interface ExchangeMarketData {
  exchange: string
  pairs: Record<string, PairData>
  status: "online" | "degraded" | "offline"
  lastUpdate: string
}

export interface PairData {
  pair: string
  bid: number
  ask: number
  volume: number
  change24h: number
  orderBook?: {
    bids: [number, number][]
    asks: [number, number][]
  }
}

export interface SystemHealthCheck {
  botStatus: "running" | "paused" | "stopped" | "error"
  uptime: number
  mode: "simulation" | "live"
  exchangeConnections: Record<string, ConnectionStatus>
  lastScan: string
  memoryUsage: number
  cpuUsage: number
  errors: SystemError[]
}

export interface ConnectionStatus {
  exchange: string
  status: "connected" | "disconnected" | "error"
  latency: number
  lastPing: string
  errorCount: number
  lastError?: string
}

export interface SystemError {
  id: string
  level: "info" | "warning" | "error" | "critical"
  message: string
  component: string
  timestamp: string
  resolved: boolean
}

// ============================================================================
// CONTRATOS DE NOTIFICAÇÃO (Manus AI Layer)
// ============================================================================

export interface NotificationConfig {
  telegram: {
    enabled: boolean
    botToken?: string
    chatId?: string
  }
  email: {
    enabled: boolean
    smtpHost?: string
    smtpPort?: number
    username?: string
    password?: string
    recipients: string[]
  }
  discord: {
    enabled: boolean
    webhookUrl?: string
  }
}

export interface NotificationRequest {
  type: "info" | "warning" | "error" | "success"
  title: string
  message: string
  priority: "low" | "medium" | "high" | "critical"
  channels: ("telegram" | "email" | "discord")[]
  metadata?: Record<string, any>
}

export interface NotificationResponse {
  success: boolean
  sentChannels: string[]
  failedChannels: string[]
  errors: string[]
}

// ============================================================================
// EVENTOS WEBSOCKET PARA TEMPO REAL
// ============================================================================

export interface WebSocketEvent {
  type: string
  timestamp: string
  data: any
}

export interface OpportunityFoundEvent extends WebSocketEvent {
  type: "opportunity_found"
  data: ArbitrageOpportunity
}

export interface TradeExecutedEvent extends WebSocketEvent {
  type: "trade_executed"
  data: {
    executionId: string
    opportunity: ArbitrageOpportunity
    result: ExecutionResponse
  }
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
// TIPOS AUXILIARES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  requestId: string
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
  startDate?: string
  endDate?: string
  exchange?: string
  pair?: string
  status?: string
  minProfit?: number
  maxProfit?: number
}
