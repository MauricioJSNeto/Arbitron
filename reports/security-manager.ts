// Gerenciador de segurança para integração com a camada de segurança (Manus AI)
// Centraliza autenticação, criptografia e validações de segurança

import { apiClient } from "./api-client"
import { eventBus } from "./event-bus"
import type { AuthRequest, AuthResponse, UserProfile } from "./api-contracts"

class SecurityManager {
  private currentUser: UserProfile | null = null
  private sessionTimeout: NodeJS.Timeout | null = null
  private readonly SESSION_DURATION = 30 * 60 * 1000 // 30 minutos

  // ============================================================================
  // AUTENTICAÇÃO
  // ============================================================================

  async login(credentials: AuthRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.login(credentials)

      if (response.success && response.user) {
        this.currentUser = response.user
        this.startSessionTimer()
        eventBus.emitLogin(response.user)

        // Log de auditoria
        this.logSecurityEvent("login_success", {
          userId: response.user.id,
          username: response.user.username,
          timestamp: new Date().toISOString(),
        })
      } else {
        // Log de tentativa de login falhada
        this.logSecurityEvent("login_failed", {
          username: credentials.username,
          timestamp: new Date().toISOString(),
          reason: response.error || "Unknown error",
        })
      }

      return response
    } catch (error) {
      this.logSecurityEvent("login_error", {
        username: credentials.username,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      this.clearSession()
      eventBus.emitLogout()

      this.logSecurityEvent("logout", {
        userId: this.currentUser?.id,
        timestamp: new Date().toISOString(),
      })
    }
  }

  private clearSession(): void {
    this.currentUser = null
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout)
      this.sessionTimeout = null
    }
  }

  private startSessionTimer(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout)
    }

    this.sessionTimeout = setTimeout(() => {
      this.handleSessionTimeout()
    }, this.SESSION_DURATION)
  }

  private handleSessionTimeout(): void {
    this.logSecurityEvent("session_timeout", {
      userId: this.currentUser?.id,
      timestamp: new Date().toISOString(),
    })

    this.logout()
    eventBus.emit("auth:session_timeout")
  }

  // ============================================================================
  // AUTORIZAÇÃO E PERMISSÕES
  // ============================================================================

  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false
    return this.currentUser.permissions.includes(permission) || this.currentUser.role === "admin"
  }

  requirePermission(permission: string): void {
    if (!this.hasPermission(permission)) {
      this.logSecurityEvent("permission_denied", {
        userId: this.currentUser?.id,
        permission,
        timestamp: new Date().toISOString(),
      })
      throw new Error(`Permission denied: ${permission}`)
    }
  }

  canExecuteTrades(): boolean {
    return this.hasPermission("execute_trades") || this.hasPermission("admin")
  }

  canModifyConfig(): boolean {
    return this.hasPermission("modify_config") || this.hasPermission("admin")
  }

  canViewLogs(): boolean {
    return this.hasPermission("view_logs") || this.hasPermission("admin")
  }

  // ============================================================================
  // VALIDAÇÃO DE OPERAÇÕES CRÍTICAS
  // ============================================================================

  async validateCriticalOperation(operation: {
    type: "trade_execution" | "config_change" | "mode_switch"
    data: any
    requiresConfirmation?: boolean
  }): Promise<{ allowed: boolean; reason?: string }> {
    // Verificar se usuário está autenticado
    if (!this.currentUser) {
      return { allowed: false, reason: "User not authenticated" }
    }

    // Verificar permissões específicas
    switch (operation.type) {
      case "trade_execution":
        if (!this.canExecuteTrades()) {
          return { allowed: false, reason: "Insufficient permissions for trade execution" }
        }
        break

      case "config_change":
        if (!this.canModifyConfig()) {
          return { allowed: false, reason: "Insufficient permissions for configuration changes" }
        }
        break

      case "mode_switch":
        if (!this.canModifyConfig()) {
          return { allowed: false, reason: "Insufficient permissions for mode switching" }
        }

        // Validação especial para mudança para modo real
        if (operation.data.mode === "live") {
          const confirmation = await this.requestCriticalConfirmation(
            "Switch to Live Trading Mode",
            "This will enable real trading with actual funds. Are you sure?",
          )
          if (!confirmation) {
            return { allowed: false, reason: "User confirmation required for live mode" }
          }
        }
        break
    }

    // Log da operação validada
    this.logSecurityEvent("operation_validated", {
      userId: this.currentUser.id,
      operation: operation.type,
      timestamp: new Date().toISOString(),
    })

    return { allowed: true }
  }

  private async requestCriticalConfirmation(title: string, message: string): Promise<boolean> {
    // Em uma implementação real, isso abriria um modal de confirmação
    // Por enquanto, simular confirmação
    return new Promise((resolve) => {
      const confirmed = confirm(`${title}\n\n${message}`)
      resolve(confirmed)
    })
  }

  // ============================================================================
  // CRIPTOGRAFIA E SEGURANÇA DE DADOS
  // ============================================================================

  async encryptSensitiveData(data: string): Promise<string> {
    // Em uma implementação real, isso usaria a API de criptografia do backend
    // Por enquanto, simular criptografia
    try {
      const response = await apiClient.request("/security/encrypt", {
        method: "POST",
        body: { data },
      })
      return response.data.encryptedData
    } catch (error) {
      console.error("Encryption failed:", error)
      throw new Error("Failed to encrypt sensitive data")
    }
  }

  async decryptSensitiveData(encryptedData: string): Promise<string> {
    // Em uma implementação real, isso usaria a API de descriptografia do backend
    try {
      const response = await apiClient.request("/security/decrypt", {
        method: "POST",
        body: { encryptedData },
      })
      return response.data.decryptedData
    } catch (error) {
      console.error("Decryption failed:", error)
      throw new Error("Failed to decrypt sensitive data")
    }
  }

  // ============================================================================
  // AUDITORIA E LOGS DE SEGURANÇA
  // ============================================================================

  private logSecurityEvent(eventType: string, data: any): void {
    const logEntry = {
      type: "security_event",
      eventType,
      data,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
      ip: "client", // Em produção, seria obtido do servidor
    }

    // Enviar para o sistema de logs
    console.log("Security Event:", logEntry)

    // Em uma implementação real, enviaria para o backend
    // apiClient.request('/security/log', { method: 'POST', body: logEntry })
  }

  // ============================================================================
  // GETTERS E UTILITÁRIOS
  // ============================================================================

  get isAuthenticated(): boolean {
    return !!this.currentUser && apiClient.isAuthenticated
  }

  get currentUserProfile(): UserProfile | null {
    return this.currentUser
  }

  get userRole(): string | null {
    return this.currentUser?.role || null
  }

  get userPermissions(): string[] {
    return this.currentUser?.permissions || []
  }

  // Verificar se a sessão está próxima do timeout
  get sessionTimeRemaining(): number {
    if (!this.sessionTimeout) return 0
    // Calcular tempo restante (implementação simplificada)
    return this.SESSION_DURATION
  }

  // Renovar sessão
  async renewSession(): Promise<boolean> {
    try {
      const renewed = await apiClient.refreshAuthToken()
      if (renewed) {
        this.startSessionTimer()
        this.logSecurityEvent("session_renewed", {
          userId: this.currentUser?.id,
          timestamp: new Date().toISOString(),
        })
      }
      return renewed
    } catch (error) {
      console.error("Session renewal failed:", error)
      return false
    }
  }
}

// Singleton instance
export const securityManager = new SecurityManager()
export default securityManager
