"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlayIcon, RefreshCw } from "lucide-react"
import type { ArbitrageOpportunity } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { executeArbitrage } from "@/lib/api"

interface ArbitrageOpportunitiesProps {
  opportunities: ArbitrageOpportunity[]
  isLoading: boolean
}

export function ArbitrageOpportunities({ opportunities, isLoading }: ArbitrageOpportunitiesProps) {
  const { toast } = useToast()
  const [executingId, setExecutingId] = useState<string | null>(null)

  const handleExecute = async (opportunity: ArbitrageOpportunity) => {
    try {
      setExecutingId(opportunity.id)

      // In a real implementation, this would call the actual API
      await executeArbitrage(opportunity.id)

      toast({
        title: "Arbitrage executed",
        description: `Successfully executed ${opportunity.buyExchange} → ${opportunity.sellExchange} arbitrage for ${opportunity.pair}`,
      })
    } catch (error) {
      toast({
        title: "Execution failed",
        description: "Failed to execute the arbitrage opportunity. Please try again.",
        variant: "destructive",
      })
      console.error("Arbitrage execution error:", error)
    } finally {
      setExecutingId(null)
    }
  }

  const handleRefresh = () => {
    toast({
      title: "Refreshing opportunities",
      description: "Scanning for new arbitrage opportunities...",
    })
    // In a real implementation, this would trigger a new scan
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Arbitrage Opportunities</CardTitle>
          <CardDescription>Current profitable trading opportunities</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
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
        ) : opportunities.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pair</TableHead>
                <TableHead>Buy At</TableHead>
                <TableHead>Sell At</TableHead>
                <TableHead className="text-right">Spread</TableHead>
                <TableHead className="text-right">Est. Profit</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((opportunity) => (
                <TableRow key={opportunity.id}>
                  <TableCell className="font-medium">{opportunity.pair}</TableCell>
                  <TableCell>
                    {opportunity.buyPrice.toFixed(2)} @ {opportunity.buyExchange}
                  </TableCell>
                  <TableCell className="flex items-center">
                    {opportunity.sellPrice.toFixed(2)} @ {opportunity.sellExchange}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={opportunity.spreadPercentage >= 1 ? "default" : "secondary"}>
                      {opportunity.spreadPercentage.toFixed(2)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-green-500">${opportunity.estimatedProfit.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleExecute(opportunity)}
                      disabled={executingId === opportunity.id}
                    >
                      {executingId === opportunity.id ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PlayIcon className="h-4 w-4 mr-2" />
                      )}
                      Execute
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <p className="text-muted-foreground mb-2">No arbitrage opportunities found</p>
            <p className="text-sm text-muted-foreground">
              The bot is continuously scanning for profitable opportunities across exchanges
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
