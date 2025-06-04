// Cliente WebSocket para comunicação em tempo real entre as camadas
// Gerencia eventos de oportunidades, execuções, status do sistema, etc.

import type {
  WebSocketEvent,
  OpportunityFoundEvent,
  TradeExecutedEvent,
  SystemStatusEvent,
  ExchangeStatusEvent,
  ErrorEvent,
} from "./api-contracts"

type EventHandler<T = any> = (data: T) => void

class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventHandlers: Map<string, EventHandler[]> = new Map()
  private isConnecting = false

  constructor(url = "ws://localhost:8080/ws") {
    this.url = url
  }

  // ============================================================================
  // CONEXÃO E RECONEXÃO
  // ============================================================================

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        reject(new Error("Connection already in progress"))
        return
      }

      this.isConnecting = true
      const wsUrl = token ? `${this.url}?token=${token}` : this.url

      try {
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log("WebSocket connected")
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.emit("connected", null)
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketEvent = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error)
          }
        }

        this.ws.onclose = (event) => {
          console.log("WebSocket disconnected:", event.code, event.reason)
          this.isConnecting = false
          this.emit("disconnected", { code: event.code, reason: event.reason })

          // Tentar reconectar se não foi fechamento intencional
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          this.isConnecting = false
          this.emit("error", error)
          reject(error)
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, "Client disconnect")
      this.ws = null
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    )

    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect().catch((error) => {
          console.error("Reconnection failed:", error)
        })
      }
    }, delay)
  }

  // ============================================================================
  // MANIPULAÇÃO DE MENSAGENS
  // ============================================================================

  private handleMessage(event: WebSocketEvent): void {
    console.log("WebSocket message received:", event.type, event.data)

    // Emitir evento específico
    this.emit(event.type, event.data)

    // Emitir evento genérico
    this.emit("message", event)

    // Manipular eventos específicos
    switch (event.type) {
      case "opportunity_found":
        this.handleOpportunityFound(event as OpportunityFoundEvent)
        break
      case "trade_executed":
        this.handleTradeExecuted(event as TradeExecutedEvent)
        break
      case "system_status":
        this.handleSystemStatus(event as SystemStatusEvent)
        break
      case "exchange_status":
        this.handleExchangeStatus(event as ExchangeStatusEvent)
        break
      case "error":
        this.handleError(event as ErrorEvent)
        break
    }
  }

  private handleOpportunityFound(event: OpportunityFoundEvent): void {
    // Lógica específica para oportunidades encontradas
    console.log("New arbitrage opportunity:", event.data)
  }

  private handleTradeExecuted(event: TradeExecutedEvent): void {
    // Lógica específica para trades executados
    console.log("Trade executed:", event.data)
  }

  private handleSystemStatus(event: SystemStatusEvent): void {
    // Lógica específica para status do sistema
    console.log("System status update:", event.data)
  }

  private handleExchangeStatus(event: ExchangeStatusEvent): void {
    // Lógica específica para status de exchanges
    console.log("Exchange status update:", event.data)
  }

  private handleError(event: ErrorEvent): void {
    // Lógica específica para erros
    console.error("System error:", event.data)
  }

  // ============================================================================
  // SISTEMA DE EVENTOS
  // ============================================================================

  on<T = any>(eventType: string, handler: EventHandler<T>): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    this.eventHandlers.get(eventType)!.push(handler)
  }

  off<T = any>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit<T = any>(eventType: string, data: T): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error)
        }
      })
    }
  }

  // ============================================================================
  // ENVIO DE MENSAGENS
  // ============================================================================

  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn("WebSocket not connected, message not sent:", message)
    }
  }

  // Métodos específicos para diferentes tipos de mensagem
  subscribeToOpportunities(pairs: string[], exchanges: string[]): void {
    this.send({
      type: "subscribe_opportunities",
      data: { pairs, exchanges },
    })
  }

  subscribeToSystemStatus(): void {
    this.send({
      type: "subscribe_system_status",
      data: {},
    })
  }

  subscribeToExchangeStatus(exchanges: string[]): void {
    this.send({
      type: "subscribe_exchange_status",
      data: { exchanges },
    })
  }

  unsubscribeFromOpportunities(): void {
    this.send({
      type: "unsubscribe_opportunities",
      data: {},
    })
  }

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  get connectionState(): string {
    if (!this.ws) return "disconnected"

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting"
      case WebSocket.OPEN:
        return "connected"
      case WebSocket.CLOSING:
        return "closing"
      case WebSocket.CLOSED:
        return "disconnected"
      default:
        return "unknown"
    }
  }
}

// Singleton instance
export const wsClient = new WebSocketClient()
export default wsClient
