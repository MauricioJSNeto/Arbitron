"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchProfitData } from "@/lib/api"
import type { ProfitData } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function ProfitChart() {
  const { toast } = useToast()
  const [profitData, setProfitData] = useState<ProfitData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("day")

  useEffect(() => {
    const loadProfitData = async () => {
      try {
        setIsLoading(true)
        // In a real implementation, this would be an actual API call
        const data = await fetchProfitData(timeframe)
        setProfitData(data)
      } catch (error) {
        toast({
          title: "Error loading profit data",
          description: "Failed to fetch the profit performance data.",
          variant: "destructive",
        })
        console.error("Profit data loading error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfitData()
  }, [timeframe, toast])

  // This is a placeholder for a real chart component
  // In a real implementation, you would use a library like recharts, chart.js, or d3
  const renderChart = () => {
    if (isLoading) {
      return <Skeleton className="h-[300px] w-full" />
    }

    if (!profitData) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No profit data available</p>
        </div>
      )
    }

    // Placeholder for chart
    return (
      <div className="h-[300px] w-full bg-muted/20 rounded-md flex items-center justify-center">
        <p className="text-muted-foreground">[Chart visualization would be here - showing profit over {timeframe}]</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Profit Performance</CardTitle>
        <CardDescription>Track your arbitrage profits over time</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="day" className="w-full" onValueChange={setTimeframe}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="day">24h</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>

            {!isLoading && profitData && (
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className="text-2xl font-bold text-green-500">${profitData.totalProfit.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ROI</p>
                  <div className="flex items-center">
                    <Badge variant={profitData.roi >= 0 ? "default" : "destructive"}>
                      {profitData.roi >= 0 ? "+" : ""}
                      {profitData.roi.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          <TabsContent value="day" className="mt-0">
            {renderChart()}
          </TabsContent>
          <TabsContent value="week" className="mt-0">
            {renderChart()}
          </TabsContent>
          <TabsContent value="month" className="mt-0">
            {renderChart()}
          </TabsContent>
          <TabsContent value="year" className="mt-0">
            {renderChart()}
          </TabsContent>

          {!isLoading && profitData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">Trades</p>
                <p className="text-xl font-semibold">{profitData.trades}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-xl font-semibold">{profitData.winRate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Profit</p>
                <p className="text-xl font-semibold">${profitData.avgProfit.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Best Trade</p>
                <p className="text-xl font-semibold">${profitData.bestTrade.toFixed(2)}</p>
              </div>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
