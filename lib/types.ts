// Core types for the arbitrage bot application

export interface BotStatus {
  status: "running" | "paused" | "stopped"
  uptime: number
  mode: "simulation" | "live"
  lastScan: string
  version: string
}

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

export interface ExchangeStatusData {
  id: string
  name: string
  type: "CEX" | "DEX"
  status: "online" | "offline" | "degraded"
  latency: number
  balance: number
  lastUpdated: string
}

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

export interface ProfitData {
  totalProfit: number
  roi: number
  trades: number
  winRate: number
  avgProfit: number
  bestTrade: number
  timeframe: string
  chartData: Array<{
    time: string
    profit: number
  }>
}

export interface Alert {
  id: string
  timestamp: string
  severity: "info" | "warning" | "error" | "critical" | "success"
  title: string
  message: string
  source: string
}

export interface ExchangeConfig {
  id: string
  name: string
  type: "CEX" | "DEX"
  enabled: boolean
  connected: boolean
  apiKey: string
  apiSecret: string
  passphrase?: string
  testnet?: boolean
  walletPrivateKey?: string
  walletAddress?: string
  rateLimits?: {
    requests: number
    window: number
  }
}

export interface ConnectionTestResult {
  success: boolean
  exchangeName: string
  balance?: number
  permissions?: string[]
  error?: string
}

export interface RiskSettings {
  maxTradeAmount: number
  minProfitThreshold: number
  maxSlippage: number
  stopLossPercentage: number
  maxDailyLoss: number
  enabledExchanges: string[]
  enabledPairs: string[]
}
