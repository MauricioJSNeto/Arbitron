"\"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { fetchExchangeConfigs, updateExchangeConfig, testExchangeConnection } from "@/lib/api"
import type { ExchangeConfig } from "@/lib/types"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"

export function ApiSettings() {
  const { toast } = useToast()
  const [exchangeConfigs, setExchangeConfigs] = useState<ExchangeConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        setIsLoading(true)
        const configs = await fetchExchangeConfigs()
        setExchangeConfigs(configs)
      } catch (error) {
        toast({
          title: "Error loading exchange configurations",
          description: "Failed to fetch the API configurations for the exchanges.",
          variant: "destructive",
        })
        console.error("Exchange config loading error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfigs()
  }, [toast])

  const handleConfigChange = (id: string, field: string, value: any) => {
    setExchangeConfigs((prevConfigs) =>
      prevConfigs.map((config) => (config.id === id ? { ...config, [field]: value } : config)),
    )
  }

  const handleSaveConfig = async (config: ExchangeConfig) => {
    try {
      setIsSubmitting(true)
      await updateExchangeConfig(config)
      toast({
        title: "Configuration saved",
        description: `Successfully updated configuration for ${config.name}.`,
      })
    } catch (error) {
      toast({
        title: "Failed to save configuration",
        description: `An error occurred while saving the configuration for ${config.name}.`,
        variant: "destructive",
      })
      console.error("Exchange config save error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTestConnection = async (exchangeId: string) => {
    try {
      setTestingConnection(exchangeId)
      const result = await testExchangeConnection(exchangeId)

      if (result.success) {
        toast({
          title: "Connection successful",
          description: `Successfully connected to ${result.exchangeName}. Balance: $${result.balance?.toFixed(2) || 0}`,
        })
        setExchangeConfigs((prevConfigs) =>
          prevConfigs.map((config) =>
            config.id === exchangeId ? { ...config, connected: true, lastError: undefined } : config,
          ),
        )
      } else {
        toast({
          title: "Connection failed",
          description: `Failed to connect to ${result.exchangeName}. Error: ${result.error}`,
          variant: "destructive",
        })
        setExchangeConfigs((prevConfigs) =>
          prevConfigs.map((config) =>
            config.id === exchangeId ? { ...config, connected: false, lastError: result.error } : config,
          ),
        )
      }
    } catch (error) {
      toast({
        title: "Connection test error",
        description: `An unexpected error occurred while testing the connection for ${exchangeId}.`,
        variant: "destructive",
      })
      console.error("Exchange connection test error:", error)
      setExchangeConfigs((prevConfigs) =>
        prevConfigs.map((config) =>
          config.id === exchangeId ? { ...config, connected: false, lastError: "Test Failed" } : config,
        ),
      )
    } finally {
      setTestingConnection(null)
    }
  }

  const getConnectionStatusIcon = (config: ExchangeConfig) => {
    if (testingConnection === config.id) {
      return <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
    }
    if (config.connected) {
      return <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
    } else if (config.lastError) {
      return <XCircle className="h-4 w-4 text-red-500 mr-2" />
    }
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>API Configuration</CardTitle>
        <CardDescription>Configure API keys and settings for each exchange</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading configurations...</div>
        ) : (
          <div className="space-y-4">
            {exchangeConfigs.map((config) => (
              <div key={config.id} className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>{config.name}</CardTitle>
                  <Switch
                    id={`enabled-${config.id}`}
                    checked={config.enabled}
                    onCheckedChange={(checked) => handleConfigChange(config.id, "enabled", checked)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`api-key-${config.id}`}>API Key</Label>
                    <Input
                      type="text"
                      id={`api-key-${config.id}`}
                      value={config.apiKey || ""}
                      onChange={(e) => handleConfigChange(config.id, "apiKey", e.target.value)}
                      disabled={!config.enabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`api-secret-${config.id}`}>API Secret</Label>
                    <Input
                      type="password"
                      id={`api-secret-${config.id}`}
                      value={config.apiSecret || ""}
                      onChange={(e) => handleConfigChange(config.id, "apiSecret", e.target.value)}
                      disabled={!config.enabled}
                    />
                  </div>
                  {config.passphrase !== undefined && (
                    <div>
                      <Label htmlFor={`api-passphrase-${config.id}`}>Passphrase</Label>
                      <Input
                        type="password"
                        id={`api-passphrase-${config.id}`}
                        value={config.passphrase || ""}
                        onChange={(e) => handleConfigChange(config.id, "passphrase", e.target.value)}
                        disabled={!config.enabled}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleTestConnection(config.id)}
                    disabled={!config.enabled || isSubmitting || testingConnection === config.id}
                  >
                    {getConnectionStatusIcon(config)}
                    Test Connection
                  </Button>
                  <Button
                    onClick={() => handleSaveConfig(config)}
                    disabled={isSubmitting || testingConnection === config.id}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
