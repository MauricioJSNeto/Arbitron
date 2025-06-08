"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArbitrageOpportunities } from "@/components/arbitrage-opportunities"
import { ExchangeStatus } from "@/components/exchange-status"
import { BotControls } from "@/components/bot-controls"
import { ProfitChart } from "@/components/profit-chart"
import { RecentTrades } from "@/components/recent-trades"
import { RiskSettings } from "@/components/risk-settings"
import { AlertsLog } from "@/components/alerts-log"
import { useToast } from "@/hooks/use-toast"
import { fetchBotStatus, fetchArbitrageOpportunities, fetchExchangeStatus } from "@/lib/api"
import type { BotStatus, ArbitrageOpportunity, ExchangeStatusData } from "@/lib/types"
import { ApiSettings } from "@/components/api-settings"

export default function Dashboard() {
  const { toast } = useToast()
  const [botStatus, setBotStatus] = useState<BotStatus>({
    status: "stopped",
    uptime: 0,
    mode: "simulation",
    lastScan: null,
    version: "1.0.0",
  })

  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [exchangeStatus, setExchangeStatus] = useState<ExchangeStatusData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)

        // In a real implementation, these would be actual API calls
        const statusData = await fetchBotStatus()
        const opportunitiesData = await fetchArbitrageOpportunities()
        const exchangeData = await fetchExchangeStatus()

        setBotStatus(statusData)
        setOpportunities(opportunitiesData)
        setExchangeStatus(exchangeData)
      } catch (error) {
        toast({
          title: "Error loading dashboard data",
          description: "Failed to fetch the latest bot status and market data.",
          variant: "destructive",
        })
        console.error("Dashboard data loading error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()

    // Set up polling interval for real-time updates
    const intervalId = setInterval(loadDashboardData, 30000) // Update every 30 seconds

    return () => clearInterval(intervalId)
  }, [toast])

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Arbitron</h1>
        <p className="text-muted-foreground">Monitor and control your arbitrage operations across multiple exchanges</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BotControls status={botStatus} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Current Mode</CardTitle>
            <CardDescription>Bot operation mode</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-24">
              <span className={`text-2xl font-bold ${botStatus.mode === "live" ? "text-green-500" : "text-amber-500"}`}>
                {botStatus.mode === "live" ? "LIVE TRADING" : "SIMULATION (PAPER TRADING)"}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Bot Status</CardTitle>
            <CardDescription>Current operational status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-24">
              <div className="flex flex-col items-center">
                <span
                  className={`text-2xl font-bold ${
                    botStatus.status === "running"
                      ? "text-green-500"
                      : botStatus.status === "paused"
                        ? "text-amber-500"
                        : "text-red-500"
                  }`}
                >
                  {botStatus.status.toUpperCase()}
                </span>
                {botStatus.status === "running" && (
                  <span className="text-sm text-muted-foreground mt-2">
                    Uptime: {Math.floor(botStatus.uptime / 3600)}h {Math.floor((botStatus.uptime % 3600) / 60)}m
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="opportunities" className="w-full">
        <TabsList className="grid grid-cols-6 md:w-fit">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="exchanges">Exchanges</TabsTrigger>
          <TabsTrigger value="trades">Recent Trades</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="api">API Config</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4 mt-2">
          <ArbitrageOpportunities opportunities={opportunities} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="exchanges" className="space-y-4 mt-2">
          <ExchangeStatus exchanges={exchangeStatus} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="trades" className="space-y-4 mt-2">
          <RecentTrades />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 mt-2">
          <ProfitChart />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RiskSettings />
            <AlertsLog />
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4 mt-2">
          <ApiSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
