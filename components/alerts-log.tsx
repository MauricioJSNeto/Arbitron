"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAlerts } from "@/lib/api"
import type { Alert } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react"

export function AlertsLog() {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setIsLoading(true)
        // In a real implementation, this would be an actual API call
        const data = await fetchAlerts()
        setAlerts(data)
      } catch (error) {
        toast({
          title: "Error loading alerts",
          description: "Failed to fetch the system alerts.",
          variant: "destructive",
        })
        console.error("Alerts loading error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAlerts()
  }, [toast])

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return null
    }
  }

  const getAlertBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>
      case "warning":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500">
            Warning
          </Badge>
        )
      case "info":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            Info
          </Badge>
        )
      case "success":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            Success
          </Badge>
        )
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>System Alerts</CardTitle>
        <CardDescription>Recent notifications and system events</CardDescription>
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
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 pb-3 border-b last:border-0">
                    <div className="pt-0.5">{getAlertIcon(alert.severity)}</div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{alert.title}</span>
                        {getAlertBadge(alert.severity)}
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <p className="text-muted-foreground mb-2">No alerts to display</p>
                  <p className="text-sm text-muted-foreground">System alerts and notifications will appear here</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
