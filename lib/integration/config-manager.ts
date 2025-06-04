// Gerenciador de configuração centralizado para todas as camadas
// Sincroniza configurações entre Frontend, Backend e Segurança

import { apiClient } from "./api-client"
import { eventBus } from "./event-bus"
import { securityManager } from "./security-manager"
import type { ArbitrageEngineConfig, NotificationConfig } from "./api-contracts"

interface AppConfig {
  arbitrage: ArbitrageEngineConfig
  notifications: NotificationConfig
  security: {
    sessionTimeout: number
    requireTwoFactor: boolean
    maxLoginAttempts: number
  }
  ui: {
    theme: "light" | "dark" | "auto"
    refreshInterval: number
    maxOpportunitiesDisplay: number
    defaultTimeframe: string
  }
  exchanges: {
    enabledExchanges: string[]
    preferredExchanges: string[]
    fallbackExchanges: string[]
  }
}

class ConfigManager {
  private config: Partial<AppConfig> = {}
  private isLoaded = false
  private saveTimeout: NodeJS.Timeout | null = null

  // ============================================================================
  // CARREGAMENTO E SALVAMENTO
  // ============================================================================

  async loadConfig(): Promise<AppConfig> {
    try {
      // Carregar configuração do backend
      const [arbitrageConfig, notificationConfig] = await Promise.all([
        apiClient.getArbitrageConfig(),
        apiClient.getNotificationConfig(),
      ])

      // Carregar configurações locais do localStorage
      const localConfig = this.loadLocalConfig()

      // Mesclar configurações
      this.config = {
        arbitrage: arbitrageConfig,
        notifications: notificationConfig,
        security: localConfig.security || {
          sessionTimeout: 30 * 60 * 1000,
          requireTwoFactor: false,
          maxLoginAttempts: 3,
        },
        ui: localConfig.ui || {
          theme: "dark",
          refreshInterval: 30000,
          maxOpportunitiesDisplay: 50,
          defaultTimeframe: "day",
        },
        exchanges: localConfig.exchanges || {
          enabledExchanges: [],
          preferredExchanges: [],
          fallbackExchanges: [],
        },
      }

      this.isLoaded = true
      eventBus.emit("config:loaded", this.config)

      return this.config as AppConfig
    } catch (error) {
      console.error("Failed to load configuration:", error)
      throw error
    }
  }

  async saveConfig(section?: keyof AppConfig): Promise<void> {
    if (!this.isLoaded) {
      throw new Error("Configuration not loaded")
    }

    try {
      // Validar permissões
      securityManager.requirePermission("modify_config")

      if (section) {
        await this.saveSectionConfig(section)
      } else {
        // Salvar todas as seções
        await Promise.all([
          this.saveSectionConfig("arbitrage"),
          this.saveSectionConfig("notifications"),
          this.saveSectionConfig("security"),
          this.saveSectionConfig("ui"),
          this.saveSectionConfig("exchanges"),
        ])
      }

      // Salvar configurações locais
      this.saveLocalConfig()

      eventBus.emitConfigChange(section || "all", this.config)
    } catch (error) {
      console.error("Failed to save configuration:", error)
      throw error
    }
  }

  private async saveSectionConfig(section: keyof AppConfig): Promise<void> {
    const sectionConfig = this.config[section]
    if (!sectionConfig) return

    switch (section) {
      case "arbitrage":
        await apiClient.updateArbitrageConfig(sectionConfig as ArbitrageEngineConfig)
        break
      case "notifications":
        await apiClient.updateNotificationConfig(sectionConfig)
        break
      case "security":
      case "ui":
      case "exchanges":
        // Estas são salvas localmente
        break
    }
  }

  // ============================================================================
  // CONFIGURAÇÕES LOCAIS (localStorage)
  // ============================================================================

  private loadLocalConfig(): Partial<AppConfig> {
    if (typeof window === "undefined") return {}

    try {
      const stored = localStorage.getItem("app_config")
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error("Failed to load local config:", error)
      return {}
    }
  }

  private saveLocalConfig(): void {
    if (typeof window === "undefined") return

    // Debounce para evitar salvamentos excessivos
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }

    this.saveTimeout = setTimeout(() => {
      try {
        const localConfig = {
          security: this.config.security,
          ui: this.config.ui,
          exchanges: this.config.exchanges,
        }
        localStorage.setItem("app_config", JSON.stringify(localConfig))
      } catch (error) {
        console.error("Failed to save local config:", error)
      }
    }, 1000)
  }

  // ============================================================================
  // GETTERS E SETTERS
  // ============================================================================

  get<T extends keyof AppConfig>(section: T): AppConfig[T] | undefined {
    return this.config[section]
  }

  set<T extends keyof AppConfig>(section: T, value: AppConfig[T]): void {
    this.config[section] = value
    eventBus.emitConfigChange(section, value)
  }

  // Getters específicos para facilitar o uso
  get arbitrageConfig(): ArbitrageEngineConfig | undefined {
    return this.config.arbitrage
  }

  set arbitrageConfig(config: ArbitrageEngineConfig) {
    this.config.arbitrage = config
    eventBus.emitConfigChange("arbitrage", config)
  }

  get notificationConfig(): NotificationConfig | undefined {
    return this.config.notifications
  }

  set notificationConfig(config: NotificationConfig) {
    this.config.notifications = config
    eventBus.emitConfigChange("notifications", config)
  }

  get uiConfig() {
    return (
      this.config.ui || {
        theme: "dark",
        refreshInterval: 30000,
        maxOpportunitiesDisplay: 50,
        defaultTimeframe: "day",
      }
    )
  }

  set uiConfig(config: AppConfig["ui"]) {
    this.config.ui = config
    eventBus.emitConfigChange("ui", config)
  }

  // ============================================================================
  // MÉTODOS DE CONVENIÊNCIA
  // ============================================================================

  async updateArbitrageSettings(updates: Partial<ArbitrageEngineConfig>): Promise<void> {
    if (!this.config.arbitrage) {
      throw new Error("Arbitrage config not loaded")
    }

    this.config.arbitrage = { ...this.config.arbitrage, ...updates }
    await this.saveConfig("arbitrage")
  }

  async updateNotificationSettings(updates: Partial<NotificationConfig>): Promise<void> {
    if (!this.config.notifications) {
      throw new Error("Notification config not loaded")
    }

    this.config.notifications = { ...this.config.notifications, ...updates }
    await this.saveConfig("notifications")
  }

  updateUISettings(updates: Partial<AppConfig["ui"]>): void {
    this.config.ui = { ...this.uiConfig, ...updates }
    this.saveLocalConfig()
    eventBus.emitConfigChange("ui", this.config.ui)
  }

  // ============================================================================
  // VALIDAÇÃO DE CONFIGURAÇÃO
  // ============================================================================

  validateArbitrageConfig(config: ArbitrageEngineConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (config.minProfitThreshold < 0 || config.minProfitThreshold > 100) {
      errors.push("Minimum profit threshold must be between 0 and 100%")
    }

    if (config.maxTradeAmount <= 0) {
      errors.push("Maximum trade amount must be greater than 0")
    }

    if (config.maxDailyLoss < 0) {
      errors.push("Maximum daily loss cannot be negative")
    }

    if (config.slippageTolerance < 0 || config.slippageTolerance > 50) {
      errors.push("Slippage tolerance must be between 0 and 50%")
    }

    if (config.enabledExchanges.length === 0) {
      errors.push("At least one exchange must be enabled")
    }

    if (config.monitoredPairs.length === 0) {
      errors.push("At least one trading pair must be monitored")
    }

    return { valid: errors.length === 0, errors }
  }

  // ============================================================================
  // RESET E DEFAULTS
  // ============================================================================

  getDefaultConfig(): AppConfig {
    return {
      arbitrage: {
        minProfitThreshold: 0.5,
        maxTradeAmount: 1000,
        maxDailyLoss: 100,
        slippageTolerance: 1.0,
        enabledExchanges: [],
        monitoredPairs: ["BTC/USDT", "ETH/USDT"],
        arbitrageTypes: ["simple"],
        riskLimits: {
          maxPositionSize: 1000,
          maxDailyTrades: 50,
          stopLossPercentage: 5,
          maxConcurrentTrades: 3,
          blacklistedTokens: [],
          whitelistedTokens: [],
        },
      },
      notifications: {
        telegram: { enabled: false },
        email: { enabled: false, recipients: [] },
        discord: { enabled: false },
      },
      security: {
        sessionTimeout: 30 * 60 * 1000,
        requireTwoFactor: false,
        maxLoginAttempts: 3,
      },
      ui: {
        theme: "dark",
        refreshInterval: 30000,
        maxOpportunitiesDisplay: 50,
        defaultTimeframe: "day",
      },
      exchanges: {
        enabledExchanges: [],
        preferredExchanges: [],
        fallbackExchanges: [],
      },
    }
  }

  async resetToDefaults(section?: keyof AppConfig): Promise<void> {
    const defaultConfig = this.getDefaultConfig()

    if (section) {
      this.config[section] = defaultConfig[section]
      await this.saveConfig(section)
    } else {
      this.config = defaultConfig
      await this.saveConfig()
    }

    eventBus.emit("config:reset", { section: section || "all" })
  }

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  get isConfigLoaded(): boolean {
    return this.isLoaded
  }

  exportConfig(): string {
    return JSON.stringify(this.config, null, 2)
  }

  async importConfig(configJson: string): Promise<void> {
    try {
      const importedConfig = JSON.parse(configJson)

      // Validar estrutura da configuração
      if (typeof importedConfig !== "object" || importedConfig === null) {
        throw new Error("Invalid configuration format")
      }

      // Validar seções específicas se presentes
      if (importedConfig.arbitrage) {
        const validation = this.validateArbitrageConfig(importedConfig.arbitrage)
        if (!validation.valid) {
          throw new Error(`Invalid arbitrage config: ${validation.errors.join(", ")}`)
        }
      }

      // Mesclar com configuração atual
      this.config = { ...this.config, ...importedConfig }

      // Salvar configuração importada
      await this.saveConfig()

      eventBus.emit("config:imported", this.config)
    } catch (error) {
      console.error("Failed to import configuration:", error)
      throw error
    }
  }

  // Obter hash da configuração para detectar mudanças
  getConfigHash(): string {
    const configString = JSON.stringify(this.config)
    // Simular hash (em produção usaria crypto.subtle ou similar)
    return btoa(configString).slice(0, 16)
  }
}

// Singleton instance
export const configManager = new ConfigManager()
export default configManager
