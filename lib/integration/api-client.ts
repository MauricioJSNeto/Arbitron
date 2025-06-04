// Cliente API unificado para comunicação entre camadas
// Centraliza todas as chamadas de API com tratamento de erros e autenticação

import type {
  AuthRequest,
  AuthResponse,
  ArbitrageEngineConfig,
  OpportunityDetectionRequest,
  OpportunityDetectionResponse,
  ExecutionRequest,
  ExecutionResponse,
  MarketDataRequest,
  MarketDataResponse,
  SystemHealthCheck,
  NotificationRequest,
  NotificationResponse,
  APIResponse,
  PaginatedResponse,
  FilterOptions,
  ExchangeConfig,
  Trade,
  Alert,
} from "./api-contracts"

class APIClient {
  private baseUrl: string
  private token: string | null = null
  private refreshToken: string | null = null

  constructor(baseUrl = "/api/v1") {
    this.baseUrl = baseUrl
    this.loadTokens()
  }

  // ============================================================================
  // AUTENTICAÇÃO E SEGURANÇA
  // ============================================================================

  async login(credentials: AuthRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: credentials,
    })

    if (response.success && response.data?.token) {
      this.token = response.data.token
      this.refreshToken = response.data.refreshToken || null
      this.saveTokens()
    }

    return response.data!
  }

  async logout(): Promise<void> {
    await this.request("/auth/logout", { method: "POST" })
    this.clearTokens()
  }

  async refreshAuthToken(): Promise<boolean> {
    if (!this.refreshToken) return false

    try {
      const response = await this.request<AuthResponse>("/auth/refresh", {
        method: "POST",
        body: { refreshToken: this.refreshToken },
      })

      if (response.success && response.data?.token) {
        this.token = response.data.token
        this.saveTokens()
        return true
      }
    } catch (error) {
      console.error("Token refresh failed:", error)
    }

    return false
  }

  // ============================================================================
  // CONFIGURAÇÃO DE EXCHANGES
  // ============================================================================

  async getExchangeConfigs(): Promise<ExchangeConfig[]> {
    const response = await this.request<ExchangeConfig[]>("/exchanges/configs")
    return response.data || []
  }

  async updateExchangeConfig(config: ExchangeConfig): Promise<void> {
    await this.request(`/exchanges/configs/${config.id}`, {
      method: "PUT",
      body: config,
    })
  }

  async testExchangeConnection(exchangeId: string): Promise<{
    success: boolean
    exchangeName: string
    balance?: number
    error?: string
  }> {
    const response = await this.request<any>(`/exchanges/${exchangeId}/test`)
    return response.data!
  }

  // ============================================================================
  // MOTOR DE ARBITRAGEM
  // ============================================================================

  async getArbitrageConfig(): Promise<ArbitrageEngineConfig> {
    const response = await this.request<ArbitrageEngineConfig>("/arbitrage/config")
    return response.data!
  }

  async updateArbitrageConfig(config: ArbitrageEngineConfig): Promise<void> {
    await this.request("/arbitrage/config", {
      method: "PUT",
      body: config,
    })
  }

  async scanOpportunities(request: OpportunityDetectionRequest): Promise<OpportunityDetectionResponse> {
    const response = await this.request<OpportunityDetectionResponse>("/arbitrage/scan", {
      method: "POST",
      body: request,
    })
    return response.data!
  }

  async executeArbitrage(request: ExecutionRequest): Promise<ExecutionResponse> {
    const response = await this.request<ExecutionResponse>("/arbitrage/execute", {
      method: "POST",
      body: request,
    })
    return response.data!
  }

  async getExecutionHistory(filters?: FilterOptions): Promise<PaginatedResponse<ExecutionResponse>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString())
      })
    }

    const response = await this.request<ExecutionResponse[]>(`/arbitrage/history?${params}`)
    return response as PaginatedResponse<ExecutionResponse>
  }

  // ============================================================================
  // DADOS DE MERCADO
  // ============================================================================

  async getMarketData(request: MarketDataRequest): Promise<MarketDataResponse> {
    const response = await this.request<MarketDataResponse>("/market/data", {
      method: "POST",
      body: request,
    })
    return response.data!
  }

  async getSystemHealth(): Promise<SystemHealthCheck> {
    const response = await this.request<SystemHealthCheck>("/system/health")
    return response.data!
  }

  // ============================================================================
  // CONTROLE DO BOT
  // ============================================================================

  async startBot(): Promise<void> {
    await this.request("/bot/start", { method: "POST" })
  }

  async pauseBot(): Promise<void> {
    await this.request("/bot/pause", { method: "POST" })
  }

  async stopBot(): Promise<void> {
    await this.request("/bot/stop", { method: "POST" })
  }

  async setBotMode(mode: "simulation" | "live"): Promise<void> {
    await this.request("/bot/mode", {
      method: "PUT",
      body: { mode },
    })
  }

  // ============================================================================
  // NOTIFICAÇÕES
  // ============================================================================

  async sendNotification(notification: NotificationRequest): Promise<NotificationResponse> {
    const response = await this.request<NotificationResponse>("/notifications/send", {
      method: "POST",
      body: notification,
    })
    return response.data!
  }

  async getNotificationConfig(): Promise<any> {
    const response = await this.request("/notifications/config")
    return response.data
  }

  async updateNotificationConfig(config: any): Promise<void> {
    await this.request("/notifications/config", {
      method: "PUT",
      body: config,
    })
  }

  // ============================================================================
  // HISTÓRICO E LOGS
  // ============================================================================

  async getTrades(filters?: FilterOptions): Promise<PaginatedResponse<Trade>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString())
      })
    }

    const response = await this.request<Trade[]>(`/trades?${params}`)
    return response as PaginatedResponse<Trade>
  }

  async getAlerts(filters?: FilterOptions): Promise<PaginatedResponse<Alert>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString())
      })
    }

    const response = await this.request<Alert[]>(`/alerts?${params}`)
    return response as PaginatedResponse<Alert>
  }

  async getLogs(filters?: FilterOptions): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString())
      })
    }

    const response = await this.request<any[]>(`/logs?${params}`)
    return response as PaginatedResponse<any>
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  private async request<T>(
    endpoint: string,
    options: {
      method?: string
      body?: any
      headers?: Record<string, string>
    } = {},
  ): Promise<APIResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const { method = "GET", body, headers = {} } = options

    // Adicionar token de autenticação se disponível
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    // Configurar headers padrão
    if (body && method !== "GET") {
      headers["Content-Type"] = "application/json"
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      // Tentar renovar token se expirado
      if (response.status === 401 && this.token) {
        const refreshed = await this.refreshAuthToken()
        if (refreshed) {
          // Tentar novamente com novo token
          headers["Authorization"] = `Bearer ${this.token}`
          const retryResponse = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
          })
          return await this.handleResponse<T>(retryResponse)
        }
      }

      return await this.handleResponse<T>(response)
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    const contentType = response.headers.get("content-type")
    let data: any

    if (contentType && contentType.includes("application/json")) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return data
  }

  private saveTokens(): void {
    if (typeof window !== "undefined") {
      if (this.token) localStorage.setItem("auth_token", this.token)
      if (this.refreshToken) localStorage.setItem("refresh_token", this.refreshToken)
    }
  }

  private loadTokens(): void {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
      this.refreshToken = localStorage.getItem("refresh_token")
    }
  }

  private clearTokens(): void {
    this.token = null
    this.refreshToken = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("refresh_token")
    }
  }

  // Getter para verificar se está autenticado
  get isAuthenticated(): boolean {
    return !!this.token
  }
}

// Singleton instance
export const apiClient = new APIClient()
export default apiClient
