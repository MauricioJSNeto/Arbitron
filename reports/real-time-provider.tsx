"use client"

// Provider para dados em tempo real usando WebSocket
// Conecta as três camadas através de eventos em tempo real

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { wsClient } from "@/lib/integration/websocket-client"
import { eventBus } from "@/lib/integration/event-bus"
import { securityManager } from "@/lib/integration/security-manager"
import type {
  ArbitrageOpportunity,
  SystemHealthCheck,
  ConnectionStatus,
  SystemError,
} from "@/lib/integration/api-contracts"

interface RealTimeContextType {
  // Estado da conexão
  isConnected: boolean
  connectionState: string

  // Dados em tempo real
  opportunities: ArbitrageOpportunity[]
  systemHealth: SystemHealthCheck | null
  exchangeStatuses: Record<string, ConnectionStatus>
  recentErrors: SystemError[]

  // Controles
  connect: () => Promise<void>
  disconnect: () => void
  subscribeToOpportunities: (pairs: string[], exchanges: string[]) => void
  clearOpportunities: () => void
}

const RealTimeContext = createContext<RealTimeContextType | null>(null)

interface RealTimeProviderProps {
  children: ReactNode
  autoConnect?: boolean
}

export function RealTimeProvider({ children, autoConnect = true }: RealTimeProviderProps) {
  // Estado da conexão
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState("disconnected")

  // Dados em tempo real
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealthCheck | null>(null)
  const [exchangeStatuses, setExchangeStatuses] = useState<Record<string, ConnectionStatus>>({})
  const [recentErrors, setRecentErrors] = useState<SystemError[]>([])

  // ============================================================================
  // CONEXÃO WEBSOCKET
  // ============================================================================

  const connect = async (): Promise<void> => {
    if (!securityManager.isAuthenticated) {
      console.warn("Cannot connect WebSocket: user not authenticated")
      return
    }

    try {
      // Usar token de autenticação se disponível
      const token = localStorage.getItem("auth_token")
      await wsClient.connect(token || undefined)
    } catch (error) {
      console.error("Failed to connect WebSocket:", error)
      throw error
    }
  }

  const disconnect = (): void => {
    wsClient.disconnect()
  }

  // ============================================================================
  // MANIPULADORES DE EVENTOS WEBSOCKET
  // ============================================================================

  useEffect(() => {
    // Eventos de conexão
    const handleConnected = () => {
      setIsConnected(true)
      setConnectionState("connected")

      // Subscrever a eventos essenciais automaticamente
      wsClient.subscribeToSystemStatus()

      // Notificar outros componentes
      eventBus.emit("websocket:connected")
    }

    const handleDisconnected = (data: any) => {
      setIsConnected(false)
      setConnectionState("disconnected")
      eventBus.emit("websocket:disconnected", data)
    }

    const handleError = (error: any) => {
      console.error("WebSocket error:", error)
      eventBus.emit("websocket:error", error)
    }

    // Eventos de dados
    const handleOpportunityFound = (opportunity: ArbitrageOpportunity) => {
      setOpportunities((prev) => {
        // Manter apenas as últimas 50 oportunidades
        const updated = [opportunity, ...prev].slice(0, 50)
        return updated
      })

      // Notificar outros componentes
      eventBus.emitOpportunityFound(opportunity)
    }

    const handleSystemStatus = (health: SystemHealthCheck) => {
      setSystemHealth(health)
      eventBus.emitSystemStatusChange(health)
    }

    const handleExchangeStatus = (data: { exchange: string; status: ConnectionStatus }) => {
      setExchangeStatuses((prev) => ({
        ...prev,
        [data.exchange]: data.status,
      }))
      eventBus.emitExchangeStatusChange(data.exchange, data.status)
    }

    const handleSystemError = (error: SystemError) => {
      setRecentErrors((prev) => {
        // Manter apenas os últimos 20 erros
        const updated = [error, ...prev].slice(0, 20)
        return updated
      })
      eventBus.emitError(error)
    }

    // Registrar manipuladores
    wsClient.on("connected", handleConnected)
    wsClient.on("disconnected", handleDisconnected)
    wsClient.on("error", handleError)
    wsClient.on("opportunity_found", handleOpportunityFound)
    wsClient.on("system_status", handleSystemStatus)
    wsClient.on("exchange_status", handleExchangeStatus)
    wsClient.on("error", handleSystemError)

    // Cleanup
    return () => {
      wsClient.off("connected", handleConnected)
      wsClient.off("disconnected", handleDisconnected)
      wsClient.off("error", handleError)
      wsClient.off("opportunity_found", handleOpportunityFound)
      wsClient.off("system_status", handleSystemStatus)
      wsClient.off("exchange_status", handleExchangeStatus)
      wsClient.off("error", handleSystemError)
    }
  }, [])

  // ============================================================================
  // INTEGRAÇÃO COM AUTENTICAÇÃO
  // ============================================================================

  useEffect(() => {
    // Conectar automaticamente quando usuário faz login
    const handleLogin = () => {
      if (autoConnect) {
        connect().catch(console.error)
      }
    }

    // Desconectar quando usuário faz logout
    const handleLogout = () => {
      disconnect()
      // Limpar dados
      setOpportunities([])
      setSystemHealth(null)
      setExchangeStatuses({})
      setRecentErrors([])
    }

    eventBus.onLogin(handleLogin)
    eventBus.onLogout(handleLogout)

    // Conectar se já autenticado
    if (autoConnect && securityManager.isAuthenticated) {
      connect().catch(console.error)
    }

    return () => {
      eventBus.off("auth:login")
      eventBus.off("auth:logout")
    }
  }, [autoConnect])

  // ============================================================================
  // CONTROLES ESPECÍFICOS
  // ============================================================================

  const subscribeToOpportunities = (pairs: string[], exchanges: string[]): void => {
    if (isConnected) {
      wsClient.subscribeToOpportunities(pairs, exchanges)
    }
  }

  const clearOpportunities = (): void => {
    setOpportunities([])
  }

  // ============================================================================
  // MONITORAMENTO DO ESTADO DA CONEXÃO
  // ============================================================================

  useEffect(() => {
    const interval = setInterval(() => {
      const currentState = wsClient.connectionState
      if (currentState !== connectionState) {
        setConnectionState(currentState)
        setIsConnected(currentState === "connected")
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [connectionState])

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: RealTimeContextType = {
    // Estado da conexão
    isConnected,
    connectionState,

    // Dados em tempo real
    opportunities,
    systemHealth,
    exchangeStatuses,
    recentErrors,

    // Controles
    connect,
    disconnect,
    subscribeToOpportunities,
    clearOpportunities,
  }

  return <RealTimeContext.Provider value={contextValue}>{children}</RealTimeContext.Provider>
}

// Hook para usar o contexto
export function useRealTime(): RealTimeContextType {
  const context = useContext(RealTimeContext)
  if (!context) {
    throw new Error("useRealTime must be used within a RealTimeProvider")
  }
  return context
}

// Hook para oportunidades específicas
export function useOpportunities(filters?: {
  pairs?: string[]
  exchanges?: string[]
  minProfit?: number
}) {
  const { opportunities, subscribeToOpportunities } = useRealTime()

  const filteredOpportunities = React.useMemo(() => {
    if (!filters) return opportunities

    return opportunities.filter((opp) => {
      if (filters.pairs && !filters.pairs.includes(opp.pair)) return false
      if (
        filters.exchanges &&
        !filters.exchanges.includes(opp.buyExchange) &&
        !filters.exchanges.includes(opp.sellExchange)
      )
        return false
      if (filters.minProfit && opp.spreadPercentage < filters.minProfit) return false
      return true
    })
  }, [opportunities, filters])

  // Auto-subscrever quando filtros mudam
  useEffect(() => {
    if (filters?.pairs && filters?.exchanges) {
      subscribeToOpportunities(filters.pairs, filters.exchanges)
    }
  }, [filters?.pairs, filters?.exchanges, subscribeToOpportunities])

  return filteredOpportunities
}

export default RealTimeProvider
