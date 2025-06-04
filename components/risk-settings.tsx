"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { updateRiskSettings } from "@/lib/api"

export function RiskSettings() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [settings, setSettings] = useState({
    minProfitThreshold: 0.5,
    maxTradeAmount: 1000,
    maxDailyLoss: 100,
    slippageTolerance: 1.0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      // In a real implementation, this would be an actual API call
      await updateRiskSettings(settings)
      toast({
        title: "Settings updated",
        description: "Risk management settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Failed to update settings",
        description: "An error occurred while saving the risk settings.",
        variant: "destructive",
      })
      console.error("Settings update error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Risk Management</CardTitle>
        <CardDescription>Configure risk parameters for the arbitrage bot</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="min-profit">Minimum Profit Threshold (%)</Label>
            <div className="flex items-center space-x-2">
              <Slider
                id="min-profit"
                min={0.1}
                max={5}
                step={0.1}
                value={[settings.minProfitThreshold]}
                onValueChange={(value) => setSettings({ ...settings, minProfitThreshold: value[0] })}
                className="flex-1"
              />
              <span className="w-12 text-right">{settings.minProfitThreshold.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum profit percentage required to execute an arbitrage opportunity
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-trade">Maximum Trade Amount ($)</Label>
            <Input
              id="max-trade"
              type="number"
              min={10}
              step={10}
              value={settings.maxTradeAmount}
              onChange={(e) => setSettings({ ...settings, maxTradeAmount: Number.parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Maximum amount to use for a single arbitrage trade</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-loss">Maximum Daily Loss ($)</Label>
            <Input
              id="max-loss"
              type="number"
              min={0}
              step={10}
              value={settings.maxDailyLoss}
              onChange={(e) => setSettings({ ...settings, maxDailyLoss: Number.parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Bot will stop trading if daily losses exceed this amount</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
            <div className="flex items-center space-x-2">
              <Slider
                id="slippage"
                min={0.1}
                max={5}
                step={0.1}
                value={[settings.slippageTolerance]}
                onValueChange={(value) => setSettings({ ...settings, slippageTolerance: value[0] })}
                className="flex-1"
              />
              <span className="w-12 text-right">{settings.slippageTolerance.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Maximum acceptable price slippage during trade execution</p>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  )
}
