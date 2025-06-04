"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PlayIcon, PauseIcon, MonitorStopIcon as StopIcon, AlertTriangle } from "lucide-react"
import type { BotStatus } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { startBot, pauseBot, stopBot, toggleBotMode } from "@/lib/api"

interface BotControlsProps {
  status: BotStatus
}

export function BotControls({ status }: BotControlsProps) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [confirmingLiveMode, setConfirmingLiveMode] = useState(false)

  const handleStart = async () => {
    try {
      setIsProcessing(true)
      await startBot()
      toast({
        title: "Bot started",
        description: "The arbitrage bot is now running and scanning for opportunities.",
      })
    } catch (error) {
      toast({
        title: "Failed to start bot",
        description: "An error occurred while trying to start the bot.",
        variant: "destructive",
      })
      console.error("Bot start error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePause = async () => {
    try {
      setIsProcessing(true)
      await pauseBot()
      toast({
        title: "Bot paused",
        description: "The arbitrage bot has been paused. No new trades will be executed.",
      })
    } catch (error) {
      toast({
        title: "Failed to pause bot",
        description: "An error occurred while trying to pause the bot.",
        variant: "destructive",
      })
      console.error("Bot pause error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStop = async () => {
    try {
      setIsProcessing(true)
      await stopBot()
      toast({
        title: "Bot stopped",
        description: "The arbitrage bot has been stopped completely.",
      })
    } catch (error) {
      toast({
        title: "Failed to stop bot",
        description: "An error occurred while trying to stop the bot.",
        variant: "destructive",
      })
      console.error("Bot stop error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleModeToggle = async () => {
    if (status.mode === "simulation" && !confirmingLiveMode) {
      setConfirmingLiveMode(true)
      return
    }

    try {
      setIsProcessing(true)
      await toggleBotMode()
      toast({
        title: `Switched to ${status.mode === "live" ? "simulation" : "live"} mode`,
        description:
          status.mode === "live"
            ? "The bot is now in simulation mode and will not execute real trades."
            : "The bot is now in live mode and will execute real trades with actual funds.",
        variant: status.mode === "live" ? "default" : "destructive",
      })
    } catch (error) {
      toast({
        title: "Failed to change mode",
        description: "An error occurred while trying to change the bot mode.",
        variant: "destructive",
      })
      console.error("Bot mode toggle error:", error)
    } finally {
      setIsProcessing(false)
      setConfirmingLiveMode(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Bot Controls</CardTitle>
        <CardDescription>Manage bot operation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                variant={status.status === "running" ? "default" : "outline"}
                size="sm"
                onClick={handleStart}
                disabled={status.status === "running" || isProcessing}
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Start
              </Button>
              <Button
                variant={status.status === "paused" ? "default" : "outline"}
                size="sm"
                onClick={handlePause}
                disabled={status.status === "stopped" || isProcessing}
              >
                <PauseIcon className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button
                variant={status.status === "stopped" ? "default" : "outline"}
                size="sm"
                onClick={handleStop}
                disabled={status.status === "stopped" || isProcessing}
              >
                <StopIcon className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="live-mode">Live Trading Mode</Label>
              <p className="text-sm text-muted-foreground">
                {status.mode === "live" ? "Execute trades with real funds" : "Simulate trades without using real funds"}
              </p>
            </div>
            <div className="flex items-center">
              {confirmingLiveMode && (
                <div className="flex items-center mr-4 text-amber-500">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span className="text-xs">Confirm switch to live mode?</span>
                </div>
              )}
              <Switch
                id="live-mode"
                checked={status.mode === "live"}
                onCheckedChange={handleModeToggle}
                disabled={isProcessing}
              />
            </div>
          </div>

          {status.lastScan && (
            <div className="text-xs text-muted-foreground mt-2">
              Last scan: {new Date(status.lastScan).toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
