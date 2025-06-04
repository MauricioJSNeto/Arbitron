// Mock API functions for the frontend
// In a real implementation, these would make actual API calls to the backend

import type {
  BotStatus,
  ArbitrageOpportunity,
  ExchangeStatusData,
  Trade,
  ProfitData,
  Alert,
  ExchangeConfig,
  ConnectionTestResult,
} from "./types"

// Bot Control API
export async function fetchBotStatus(): Promise<BotStatus> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    status: "running",
    uptime: 3600, // 1 hour
    mode: "simulation",
    lastScan: new Date().toISOString(),
    version: "1.0.0",
  }
}

export async function startBot(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  // In a real implementation, this would start the bot
}

export async function pauseBot(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  // In a real implementation, this would pause the bot
}

export async function stopBot(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  // In a real implementation, this would stop the bot
}

export async function toggleBotMode(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  // In a real implementation, this would toggle between simulation and live mode
}

// Arbitrage API
export async function fetchArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 800))

  return [
    {
      id: "arb1",
      pair: "BTC/USDT",
      buyExchange: "Binance",
      sellExchange: "Kraken",
      buyPrice: 65432.5,
      sellPrice: 65498.75,
      spreadPercentage: 0.1,
      estimatedProfit: 66.25,
      timestamp: new Date().toISOString(),
      type: "simple",
    },
    {
      id: "arb2",
      pair: "ETH/USDT",
      buyExchange: "KuCoin",
      sellExchange: "Coinbase",
      buyPrice: 3456.25,
      sellPrice: 3489.5,
      spreadPercentage: 0.96,
      estimatedProfit: 33.25,
      timestamp: new Date().toISOString(),
      type: "simple",
    },
    {
      id: "arb3",
      pair: "SOL/USDT",
      buyExchange: "Bybit",
      sellExchange: "Uniswap",
      buyPrice: 145.75,
      sellPrice: 147.25,
      spreadPercentage: 1.03,
      estimatedProfit: 15.0,
      timestamp: new Date().toISOString(),
      type: "cross-chain",
    },
  ]
}

export async function executeArbitrage(opportunityId: string): Promise<void> {
  // Simulate API call with delay
  await new Promise((resolve) => setTimeout(resolve, 2000))
  // In a real implementation, this would execute the arbitrage opportunity
}

// Exchange API
export async function fetchExchangeStatus(): Promise<ExchangeStatusData[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 700))

  return [
    {
      id: "ex1",
      name: "Binance",
      type: "CEX",
      status: "online",
      latency: 45,
      balance: 10000.0,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "ex2",
      name: "Kraken",
      type: "CEX",
      status: "online",
      latency: 78,
      balance: 5000.0,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "ex3",
      name: "Coinbase",
      type: "CEX",
      status: "degraded",
      latency: 320,
      balance: 7500.0,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "ex4",
      name: "KuCoin",
      type: "CEX",
      status: "online",
      latency: 95,
      balance: 3000.0,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "ex5",
      name: "Uniswap",
      type: "DEX",
      status: "online",
      latency: 150,
      balance: 2000.0,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "ex6",
      name: "PancakeSwap",
      type: "DEX",
      status: "online",
      latency: 180,
      balance: 1500.0,
      lastUpdated: new Date().toISOString(),
    },
  ]
}

// Trades API
export async function fetchRecentTrades(): Promise<Trade[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 900))

  return [
    {
      id: "trade1",
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
      pair: "BTC/USDT",
      type: "simple",
      buyExchange: "Binance",
      sellExchange: "Kraken",
      amount: 0.1,
      profit: 65.5,
      status: "completed",
    },
    {
      id: "trade2",
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
      pair: "ETH/USDT",
      type: "simple",
      buyExchange: "KuCoin",
      sellExchange: "Coinbase",
      amount: 1.5,
      profit: 45.75,
      status: "completed",
    },
    {
      id: "trade3",
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
      pair: "SOL/USDT",
      type: "cross-chain",
      buyExchange: "Bybit",
      sellExchange: "Uniswap",
      amount: 10,
      profit: -12.25,
      status: "partial",
    },
    {
      id: "trade4",
      timestamp: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hours ago
      pair: "LINK/USDT",
      type: "triangular",
      buyExchange: "Binance",
      sellExchange: "Binance",
      amount: 50,
      profit: 28.5,
      status: "completed",
    },
    {
      id: "trade5",
      timestamp: new Date(Date.now() - 180 * 60000).toISOString(), // 3 hours ago
      pair: "AVAX/USDT",
      type: "simple",
      buyExchange: "OKX",
      sellExchange: "Bybit",
      amount: 25,
      profit: 18.75,
      status: "completed",
    },
  ]
}

// Profit API
export async function fetchProfitData(timeframe: string): Promise<ProfitData> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1200))

  return {
    totalProfit: 2450.75,
    roi: 24.5,
    trades: 87,
    winRate: 92,
    avgProfit: 28.17,
    bestTrade: 145.5,
    timeframe,
    chartData: [
      // This would be time-series data for the chart
      { time: "2023-05-01", profit: 100 },
      { time: "2023-05-02", profit: 150 },
      // ... more data points
    ],
  }
}

// Settings API
export async function updateRiskSettings(settings: any): Promise<void> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1500))
  // In a real implementation, this would update the risk settings
}

// Alerts API
export async function fetchAlerts(): Promise<Alert[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 600))

  return [
    {
      id: "alert1",
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
      severity: "success",
      title: "Arbitrage Executed",
      message: "Successfully executed BTC/USDT arbitrage between Binance and Kraken with $65.50 profit.",
      source: "execution-engine",
    },
    {
      id: "alert2",
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
      severity: "warning",
      title: "High Latency Detected",
      message: "Coinbase API response time increased to 320ms, above the 200ms threshold.",
      source: "monitoring",
    },
    {
      id: "alert3",
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
      severity: "info",
      title: "Bot Mode Changed",
      message: "Bot operation mode changed from simulation to live trading.",
      source: "system",
    },
    {
      id: "alert4",
      timestamp: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hours ago
      severity: "critical",
      title: "API Authentication Failed",
      message: "Failed to authenticate with KuCoin API. Check API key permissions.",
      source: "connection-manager",
    },
  ]
}

// Exchange Configuration API
export async function fetchExchangeConfigs(): Promise<ExchangeConfig[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 800))

  return [
    {
      id: "binance",
      name: "Binance",
      type: "CEX",
      enabled: false,
      connected: false,
      apiKey: "",
      apiSecret: "",
      testnet: false,
      rateLimits: { requests: 1200, window: 60 },
    },
    {
      id: "kraken",
      name: "Kraken",
      type: "CEX",
      enabled: false,
      connected: false,
      apiKey: "",
      apiSecret: "",
      rateLimits: { requests: 60, window: 60 },
    },
    {
      id: "coinbase",
      name: "Coinbase Pro",
      type: "CEX",
      enabled: false,
      connected: false,
      apiKey: "",
      apiSecret: "",
      passphrase: "",
      rateLimits: { requests: 10, window: 1 },
    },
    {
      id: "kucoin",
      name: "KuCoin",
      type: "CEX",
      enabled: false,
      connected: false,
      apiKey: "",
      apiSecret: "",
      passphrase: "",
      rateLimits: { requests: 100, window: 10 },
    },
    {
      id: "bybit",
      name: "Bybit",
      type: "CEX",
      enabled: false,
      connected: false,
      apiKey: "",
      apiSecret: "",
      rateLimits: { requests: 120, window: 60 },
    },
    {
      id: "okx",
      name: "OKX",
      type: "CEX",
      enabled: false,
      connected: false,
      apiKey: "",
      apiSecret: "",
      passphrase: "",
      rateLimits: { requests: 60, window: 2 },
    },
    {
      id: "uniswap",
      name: "Uniswap V3",
      type: "DEX",
      enabled: false,
      connected: false,
      walletPrivateKey: "",
      walletAddress: "",
    },
    {
      id: "pancakeswap",
      name: "PancakeSwap",
      type: "DEX",
      enabled: false,
      connected: false,
      walletPrivateKey: "",
      walletAddress: "",
    },
    {
      id: "sushiswap",
      name: "SushiSwap",
      type: "DEX",
      enabled: false,
      connected: false,
      walletPrivateKey: "",
      walletAddress: "",
    },
  ]
}

export async function updateExchangeConfig(config: ExchangeConfig): Promise<void> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))
  // In a real implementation, this would securely store the encrypted credentials
}

export async function testExchangeConnection(exchangeId: string): Promise<ConnectionTestResult> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Mock successful connection test
  const exchangeNames: Record<string, string> = {
    binance: "Binance",
    kraken: "Kraken",
    coinbase: "Coinbase Pro",
    kucoin: "KuCoin",
    bybit: "Bybit",
    okx: "OKX",
    uniswap: "Uniswap V3",
    pancakeswap: "PancakeSwap",
    sushiswap: "SushiSwap",
  }

  return {
    success: true,
    exchangeName: exchangeNames[exchangeId] || "Unknown Exchange",
    balance: Math.random() * 10000, // Mock balance
    permissions: ["spot", "trade"], // Mock permissions
  }
}
