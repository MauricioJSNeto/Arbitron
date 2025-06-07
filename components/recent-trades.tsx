"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchRecentTrades } from "@/lib/api"
import type { Trade } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function RecentTrades() {
  const { toast } = useToast()
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTrades = async () => {
      try {
        setIsLoading(true)
        // In a real implementation, this would be an actual API call
        const data = await fetchRecentTrades()
        setTrades(data)
      } catch (error) {
        toast({
          title: "Error loading trades",
          description: "Failed to fetch the recent trades data.",
          variant: "destructive",
        })
        console.error("Trades loading error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTrades()
  }, [toast])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "partial":
        return <Badge variant="secondary">Partial</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Recent Trades</CardTitle>
        <CardDescription>History of executed arbitrage trades</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
          </div>
        ) : trades.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="text-muted-foreground">{new Date(trade.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{trade.pair}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{trade.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {trade.buyExchange} → {trade.sellExchange}
                  </TableCell>
                  <TableCell className="text-right">${trade.amount.toFixed(2)}</TableCell>
                  <TableCell className={`text-right ${trade.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {trade.profit >= 0 ? "+" : ""}
                    {trade.profit.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(trade.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <p className="text-muted-foreground mb-2">No trades executed yet</p>
            <p className="text-sm text-muted-foreground">
              Trades will appear here once the bot executes arbitrage opportunities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
