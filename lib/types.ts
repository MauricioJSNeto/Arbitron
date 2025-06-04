// Bot Status Types
export interface BotStatus {
  status: "running" | "paused" | "stopped"
  uptime: number // in seconds
  mode: "live" | "simulation"
  lastScan: string | null // ISO timestamp
  version: string
}

// Arbitrage Types
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
}

// Exchange Types
export interface ExchangeStatusData {
  id: string
  name: string
  type: "CEX" | "DEX"
  status: "online" | "degraded" | "offline"
  latency: number // in milliseconds
  balance: number
  lastUpdated: string // ISO timestamp
}

// Trade Types
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

// Profit Types
export interface ProfitData {
  totalProfit: number
  roi: number
  trades: number
  winRate: number
  avgProfit: number
  bestTrade: number
  timeframe: string
  chartData: { time: string; profit: number }[]
}

// Alert Types
export interface Alert {
  id: string
  timestamp: string
  severity: "critical" | "warning" | "info" | "success"
  title: string
  message: string
  source: string
}

// Exchange Configuration Types
export interface ExchangeConfig {
  id: string
  name: string
  type: "CEX" | "DEX"
  enabled: boolean
  connected: boolean
  apiKey?: string
  apiSecret?: string
  passphrase?: string // For exchanges like OKX
  walletPrivateKey?: string // For DEX
  walletAddress?: string // For DEX
  testnet?: boolean
  lastError?: string
  permissions?: string[]
  rateLimits?: {
    requests: number
    window: number // in seconds
  }
}

export interface ConnectionTestResult {
  success: boolean
  exchangeName: string
  balance?: number
  error?: string
  permissions?: string[]
}
