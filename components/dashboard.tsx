"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Activity, DollarSign, Settings, Bell, Zap, Shield, Globe } from "lucide-react"

// Import components
import { BotControls } from "./bot-controls"
import { ArbitrageOpportunities } from "./arbitrage-opportunities"
import { ExchangeStatus } from "./exchange-status"
import { RecentTrades } from "./recent-trades"
import { ProfitChart } from "./profit-chart"
import { AlertsLog } from "./alerts-log"
import { ApiSettings } from "./api-settings"
import { RiskSettings } from "./risk-settings"

// Import types and API functions
import type { BotStatus, ArbitrageOpportunity, ExchangeStatusData, Trade, Alert, ProfitData } from "@/lib/types"
import {
  fetchBotStatus,
  fetchOpportunities,
  fetchExchangeStatus,
  fetchRecentTrades,
  fetchAlerts,
  fetchProfitData,
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function Dashboard() {
  const { toast } = useToast()

  // State management
  const [botStatus, setBotStatus] = useState<BotStatus>({
    status: "stopped",
    mode: "simulation",
    uptime: 0,
    lastScan: null,
    totalTrades: 0,
    successRate: 0,
    totalProfit: 0,
  })

  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [exchanges, setExchanges] = useState<ExchangeStatusData[]>([])
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [profitData, setProfitData] = useState<ProfitData | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Load initial data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)

        const [statusData, opportunitiesData, exchangesData, tradesData, alertsData, profitDataResult] =
          await Promise.all([
            fetchBotStatus(),
            fetchOpportunities(),
            fetchExchangeStatus(),
            fetchRecentTrades(),
            fetchAlerts(),
            fetchProfitData("day"),
          ])

        setBotStatus(statusData)
        setOpportunities(opportunitiesData)
        setExchanges(exchangesData)
        setRecentTrades(tradesData)
        setAlerts(alertsData)
        setProfitData(profitDataResult)
      } catch (error) {
        toast({
          title: "Error loading dashboard",
          description: "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive",
        })
        console.error("Dashboard loading error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [toast])

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [statusData, opportunitiesData] = await Promise.all([fetchBotStatus(), fetchOpportunities()])
        setBotStatus(statusData)
        setOpportunities(opportunitiesData)
      } catch (error) {
        console.error("Auto-refresh error:", error)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Calculate metrics
  const totalOpportunities = opportunities.length
  const avgSpread =
    opportunities.length > 0
      ? opportunities.reduce((sum, opp) => sum + opp.spreadPercentage, 0) / opportunities.length
      : 0
  const onlineExchanges = exchanges.filter((ex) => ex.status === "online").length
  const totalExchanges = exchanges.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Arbitron
              <Badge variant="outline" className="ml-3 text-green-400 border-green-400">
                v2.0
              </Badge>
            </h1>
            <p className="text-slate-300">Advanced cryptocurrency arbitrage trading platform</p>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Bot Status</CardTitle>
              <Activity
                className={`h-4 w-4 ${
                  botStatus.status === "running"
                    ? "text-green-400"
                    : botStatus.status === "paused"
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white capitalize">{botStatus.status}</div>
              <p className="text-xs text-slate-400">Mode: {botStatus.mode}</p>
              <div className="mt-2">
                <Progress value={botStatus.status === "running" ? 100 : 0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">${botStatus.totalProfit.toFixed(2)}</div>
              <p className="text-xs text-slate-400">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12.5% from last week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Opportunities</CardTitle>
              <Zap className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalOpportunities}</div>
              <p className="text-xs text-slate-400">Avg spread: {avgSpread.toFixed(2)}%</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Exchanges</CardTitle>
              <Globe className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {onlineExchanges}/{totalExchanges}
              </div>
              <p className="text-xs text-slate-400">
                <Shield className="inline h-3 w-3 mr-1" />
                All connections secure
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-7 bg-slate-800/50">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="text-xs">
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="exchanges" className="text-xs">
              Exchanges
            </TabsTrigger>
            <TabsTrigger value="trades" className="text-xs">
              Trades
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs">
              Performance
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs">
              Alerts
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <BotControls status={botStatus} />
                <ArbitrageOpportunities opportunities={opportunities.slice(0, 5)} isLoading={isLoading} />
              </div>
              <div className="space-y-6">
                <ExchangeStatus exchanges={exchanges.slice(0, 6)} isLoading={isLoading} />
                <AlertsLog />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="opportunities">
            <ArbitrageOpportunities opportunities={opportunities} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="exchanges">
            <ExchangeStatus exchanges={exchanges} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="trades">
            <RecentTrades />
          </TabsContent>

          <TabsContent value="performance">
            <ProfitChart />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsLog />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ApiSettings />
              <RiskSettings />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
