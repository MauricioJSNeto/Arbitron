"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { ExchangeStatusData } from "@/lib/types"
import { CheckCircle, AlertCircle, XCircle } from "lucide-react"

interface ExchangeStatusProps {
  exchanges: ExchangeStatusData[]
  isLoading: boolean
}

export function ExchangeStatus({ exchanges, isLoading }: ExchangeStatusProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case "offline":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getLatencyClass = (latency: number) => {
    if (latency < 100) return "text-green-500"
    if (latency < 500) return "text-amber-500"
    return "text-red-500"
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Exchange Status</CardTitle>
        <CardDescription>Current connection status to exchanges</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exchange</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Latency</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exchanges.map((exchange) => (
                <TableRow key={exchange.id}>
                  <TableCell className="font-medium">{exchange.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{exchange.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(exchange.status)}
                      <span className="capitalize">{exchange.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className={`text-right ${getLatencyClass(exchange.latency)}`}>
                    {exchange.latency} ms
                  </TableCell>
                  <TableCell className="text-right">${exchange.balance.toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(exchange.lastUpdated).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
