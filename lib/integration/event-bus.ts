// Sistema de eventos centralizado para comunicação entre componentes
// Permite comunicação desacoplada entre as diferentes camadas

type EventCallback<T = any> = (data: T) => void

interface EventSubscription {
  id: string
  callback: EventCallback
  once: boolean
}

class EventBus {
  private events: Map<string, EventSubscription[]> = new Map()
  private subscriptionId = 0

  // ============================================================================
  // SUBSCRIÇÃO DE EVENTOS
  // ============================================================================

  on<T = any>(eventName: string, callback: EventCallback<T>): string {
    return this.subscribe(eventName, callback, false)
  }

  once<T = any>(eventName: string, callback: EventCallback<T>): string {
    return this.subscribe(eventName, callback, true)
  }

  private subscribe<T = any>(eventName: string, callback: EventCallback<T>, once: boolean): string {
    const id = (++this.subscriptionId).toString()

    if (!this.events.has(eventName)) {
      this.events.set(eventName, [])
    }

    this.events.get(eventName)!.push({
      id,
      callback,
      once,
    })

    return id
  }

  // ============================================================================
  // REMOÇÃO DE EVENTOS
  // ============================================================================

  off(eventName: string, subscriptionId?: string): void {
    if (!this.events.has(eventName)) return

    const subscriptions = this.events.get(eventName)!

    if (subscriptionId) {
      // Remover subscrição específica
      const index = subscriptions.findIndex((sub) => sub.id === subscriptionId)
      if (index > -1) {
        subscriptions.splice(index, 1)
      }
    } else {
      // Remover todas as subscrições do evento
      this.events.delete(eventName)
    }

    // Limpar array vazio
    if (subscriptions.length === 0) {
      this.events.delete(eventName)
    }
  }

  // ============================================================================
  // EMISSÃO DE EVENTOS
  // ============================================================================

  emit<T = any>(eventName: string, data?: T): void {
    const subscriptions = this.events.get(eventName)
    if (!subscriptions) return

    // Criar cópia para evitar problemas se callbacks modificarem a lista
    const subscriptionsCopy = [...subscriptions]

    subscriptionsCopy.forEach((subscription) => {
      try {
        subscription.callback(data)

        // Remover subscrições "once" após execução
        if (subscription.once) {
          this.off(eventName, subscription.id)
        }
      } catch (error) {
        console.error(`Error in event callback for ${eventName}:`, error)
      }
    })
  }

  // ============================================================================
  // EVENTOS ESPECÍFICOS DO SISTEMA
  // ============================================================================

  // Eventos de autenticação
  emitLogin(user: any): void {
    this.emit("auth:login", user)
  }

  emitLogout(): void {
    this.emit("auth:logout")
  }

  onLogin(callback: EventCallback): string {
    return this.on("auth:login", callback)
  }

  onLogout(callback: EventCallback): string {
    return this.on("auth:logout", callback)
  }

  // Eventos de oportunidades
  emitOpportunityFound(opportunity: any): void {
    this.emit("arbitrage:opportunity_found", opportunity)
  }

  emitOpportunityExecuted(execution: any): void {
    this.emit("arbitrage:opportunity_executed", execution)
  }

  onOpportunityFound(callback: EventCallback): string {
    return this.on("arbitrage:opportunity_found", callback)
  }

  onOpportunityExecuted(callback: EventCallback): string {
    return this.on("arbitrage:opportunity_executed", callback)
  }

  // Eventos de sistema
  emitSystemStatusChange(status: any): void {
    this.emit("system:status_change", status)
  }

  emitExchangeStatusChange(exchange: string, status: any): void {
    this.emit("system:exchange_status_change", { exchange, status })
  }

  onSystemStatusChange(callback: EventCallback): string {
    return this.on("system:status_change", callback)
  }

  onExchangeStatusChange(callback: EventCallback): string {
    return this.on("system:exchange_status_change", callback)
  }

  // Eventos de configuração
  emitConfigChange(section: string, config: any): void {
    this.emit(`config:${section}_change`, config)
  }

  onConfigChange(section: string, callback: EventCallback): string {
    return this.on(`config:${section}_change`, callback)
  }

  // Eventos de notificação
  emitNotification(notification: any): void {
    this.emit("notification:new", notification)
  }

  onNotification(callback: EventCallback): string {
    return this.on("notification:new", callback)
  }

  // Eventos de erro
  emitError(error: any): void {
    this.emit("system:error", error)
  }

  onError(callback: EventCallback): string {
    return this.on("system:error", callback)
  }

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  // Listar todos os eventos ativos
  getActiveEvents(): string[] {
    return Array.from(this.events.keys())
  }

  // Contar subscrições para um evento
  getSubscriptionCount(eventName: string): number {
    return this.events.get(eventName)?.length || 0
  }

  // Limpar todos os eventos
  clear(): void {
    this.events.clear()
  }

  // Debug: listar todas as subscrições
  debug(): void {
    console.log("EventBus Debug:")
    this.events.forEach((subscriptions, eventName) => {
      console.log(`  ${eventName}: ${subscriptions.length} subscriptions`)
      subscriptions.forEach((sub) => {
        console.log(`    - ${sub.id} (once: ${sub.once})`)
      })
    })
  }
}

// Singleton instance
export const eventBus = new EventBus()
export default eventBus
