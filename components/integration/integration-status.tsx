"use client"

// Componente para monitorar o status da integração entre as camadas
// Exibe conectividade, saúde dos serviços e estatísticas de comunicação

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, Activity, Database, Shield, Zap } from "lucide-react"
import { useRealTime } from "./real-time-provider"
import { apiClient } from "@/lib/integration/api-client"
import { wsClient } from "@/lib/integration/websocket-client"
import { securityManager } from "@/lib/integration/security-manager"
import { configManager } from "@/lib/integration/config-manager"
import { eventBus } from "@/lib/integration/event-bus"

interface IntegrationMetrics {
  api: {
    status: "connected" | "disconnected" | "error"
    responseTime: number
    requestCount: number
    errorCount: number
    lastRequest: string
  }
  websocket: {
    status: "connected" | "disconnected" | "connecting"
    messageCount: number
    reconnectCount: number
    lastMessage: string
  }
  security: {
    authenticated: boolean
    sessionValid: boolean
    permissionsLoaded: boolean
    lastActivity: string
  }
  config: {
    loaded: boolean
    lastSync: string
    pendingChanges: number
  }
}

export function IntegrationStatus() {
  const { isConnected, connectionState, systemHealth } = useRealTime()
  const [metrics, setMetrics] = useState<IntegrationMetrics>({
    api: {
      status: "disconnected",
      responseTime: 0,
      requestCount: 0,
      errorCount: 0,
      lastRequest: "Never",
    },
    websocket: {
      status: "disconnected",
      messageCount: 0,
      reconnectCount: 0,
      lastMessage: "Never",
    },
    security: {
      authenticated: false,
      sessionValid: false,
      permissionsLoaded: false,
      lastActivity: "Never",
    },
    config: {
      loaded: false,
      lastSync: "Never",
      pendingChanges: 0,
    },
  })

  const [isRefreshing, setIsRefreshing] = useState(false)

  // ============================================================================
  // COLETA DE MÉTRICAS
  // ============================================================================

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics((prev) => ({
        ...prev,
        websocket: {
          ...prev.websocket,
          status: wsClient.connectionState as any,
        },
        security: {
          ...prev.security,
          authenticated: securityManager.isAuthenticated,
          sessionValid: securityManager.isAuthenticated,
          permissionsLoaded: securityManager.userPermissions.length > 0,
        },
        config: {
          ...prev.config,
          loaded: configManager.isConfigLoaded,
        },
      }))
    }

    // Atualizar métricas periodicamente
    const interval = setInterval(updateMetrics, 5000)
    updateMetrics()

    return () => clearInterval(interval)
  }, [])

  // Escutar eventos para atualizar métricas
  useEffect(() => {
    const handleApiRequest = () => {
      setMetrics((prev) => ({
        ...prev,
        api: {
          ...prev.api,
          requestCount: prev.api.requestCount + 1,
          lastRequest: new Date().toLocaleTimeString(),
        },
      }))
    }

    const handleWebSocketMessage = () => {
      setMetrics((prev) => ({
        ...prev,
        websocket: {
          ...prev.websocket,
          messageCount: prev.websocket.messageCount + 1,
          lastMessage: new Date().toLocaleTimeString(),
        },
      }))
    }

    const handleConfigChange = () => {
      setMetrics((prev) => ({
        ...prev,
        config: {
          ...prev.config,
          lastSync: new Date().toLocaleTimeString(),
        },
      }))
    }

    // Registrar listeners (em uma implementação real)
    eventBus.on("api:request", handleApiRequest)
    eventBus.on("websocket:message", handleWebSocketMessage)
    eventBus.on("config:change", handleConfigChange)

    return () => {
      eventBus.off("api:request")
      eventBus.off("websocket:message")
      eventBus.off("config:change")
    }
  }, [])

  // ============================================================================
  // AÇÕES DE CONTROLE
  // ============================================================================

  const handleRefreshStatus = async () => {
    setIsRefreshing(true)
    try {
      // Testar conectividade da API
      const startTime = Date.now()
      await apiClient.getSystemHealth()
      const responseTime = Date.now() - startTime

      setMetrics((prev) => ({
        ...prev,
        api: {
          ...prev.api,
          status: "connected",
          responseTime,
          lastRequest: new Date().toLocaleTimeString(),
        },
      }))
    } catch (error) {
      setMetrics((prev) => ({
        ...prev,
        api: {
          ...prev.api,
          status: "error",
          errorCount: prev.api.errorCount + 1,
        },
      }))
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleReconnectWebSocket = async () => {
    try {
      await wsClient.connect()
      setMetrics((prev) => ({
        ...prev,
        websocket: {
          ...prev.websocket,
          reconnectCount: prev.websocket.reconnectCount + 1,
        },
      }))
    } catch (error) {
      console.error("Failed to reconnect WebSocket:", error)
    }
  }

  // ============================================================================
  // COMPONENTES DE STATUS
  // ============================================================================

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "connecting":
        return <Activity className="h-5 w-5 text-yellow-500 animate-pulse" />
      case "disconnected":
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge variant="default">Connected</Badge>
      case "connecting":
        return <Badge variant="outline">Connecting</Badge>
      case "disconnected":
        return <Badge variant="destructive">Disconnected</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Integration Status
          </CardTitle>
          <CardDescription>Monitor the health and connectivity of all system layers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
              <span className="font-medium">Overall Status: {isConnected ? "Connected" : "Disconnected"}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefreshStatus} disabled={isRefreshing}>
              {isRefreshing ? "Refreshing..." : "Refresh Status"}
            </Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="api">API Layer</TabsTrigger>
              <TabsTrigger value="websocket">WebSocket</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">API</p>
                        <p className="text-xs text-muted-foreground">{metrics.api.responseTime}ms</p>
                      </div>
                      {getStatusIcon(metrics.api.status)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">WebSocket</p>
                        <p className="text-xs text-muted-foreground">{metrics.websocket.messageCount} msgs</p>
                      </div>
                      {getStatusIcon(metrics.websocket.status)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Security</p>
                        <p className="text-xs text-muted-foreground">
                          {metrics.security.authenticated ? "Authenticated" : "Not authenticated"}
                        </p>
                      </div>
                      {getStatusIcon(metrics.security.authenticated ? "connected" : "disconnected")}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Config</p>
                        <p className="text-xs text-muted-foreground">
                          {metrics.config.loaded ? "Loaded" : "Not loaded"}
                        </p>
                      </div>
                      {getStatusIcon(metrics.config.loaded ? "connected" : "disconnected")}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {systemHealth && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium">Bot Status</p>
                        <Badge variant={systemHealth.botStatus === "running" ? "default" : "destructive"}>
                          {systemHealth.botStatus}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Uptime</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.floor(systemHealth.uptime / 3600)}h {Math.floor((systemHealth.uptime % 3600) / 60)}m
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Memory</p>
                        <div className="flex items-center gap-2">
                          <Progress value={systemHealth.memoryUsage} className="flex-1" />
                          <span className="text-xs">{systemHealth.memoryUsage}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">CPU</p>
                        <div className="flex items-center gap-2">
                          <Progress value={systemHealth.cpuUsage} className="flex-1" />
                          <span className="text-xs">{systemHealth.cpuUsage}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    API Layer Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Connection Status</span>
                    {getStatusBadge(metrics.api.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Response Time</span>
                    <span className="text-sm">{metrics.api.responseTime}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Requests</span>
                    <span className="text-sm">{metrics.api.requestCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Error Count</span>
                    <span className="text-sm text-red-500">{metrics.api.errorCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Request</span>
                    <span className="text-sm text-muted-foreground">{metrics.api.lastRequest}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="websocket" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    WebSocket Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Connection Status</span>
                    {getStatusBadge(metrics.websocket.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Messages Received</span>
                    <span className="text-sm">{metrics.websocket.messageCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Reconnect Count</span>
                    <span className="text-sm">{metrics.websocket.reconnectCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Message</span>
                    <span className="text-sm text-muted-foreground">{metrics.websocket.lastMessage}</span>
                  </div>
                  {!isConnected && (
                    <Button variant="outline" size="sm" onClick={handleReconnectWebSocket} className="w-full">
                      Reconnect WebSocket
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Authentication</span>
                    {getStatusBadge(metrics.security.authenticated ? "connected" : "disconnected")}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Session Valid</span>
                    {getStatusBadge(metrics.security.sessionValid ? "connected" : "disconnected")}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Permissions Loaded</span>
                    {getStatusBadge(metrics.security.permissionsLoaded ? "connected" : "disconnected")}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>User Role</span>
                    <span className="text-sm">{securityManager.userRole || "None"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Activity</span>
                    <span className="text-sm text-muted-foreground">{metrics.security.lastActivity}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default IntegrationStatus
