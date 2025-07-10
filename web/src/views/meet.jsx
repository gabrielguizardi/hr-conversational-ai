import { useEffect, useRef, useState, useCallback } from "react"
import { MicIcon, MicOffIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

import { AudioRecorder } from "@/helpers/audioRecorder"
import { useGeminiLiveApi } from "@/hooks/useGeminiLiveApi"
import { isDevelopment } from "@/services/application"

const Meet = () => {
  const [audioRecorder] = useState(() => new AudioRecorder())
  const [muted, setMuted] = useState(false)
  const [logs, setLogs] = useState([])
  const connectButtonRef = useRef(null)

  const { client, connected, connect, disconnect } = useGeminiLiveApi()

  const addLog = useCallback((message) => {
    setLogs((prev) => [
      ...prev.slice(-9), // Mantém apenas os últimos 10 logs
      { timestamp: new Date().toLocaleTimeString(), message },
    ])
  }, [])

  useEffect(() => {
    const onData = (base64) => {
      if (client && typeof client.sendAudioChunk === "function") {
        client.sendAudioChunk(base64)
      }
    }

    const handleAudioRecording = async () => {
      if (connected && !muted && audioRecorder) {
        try {
          addLog("Requesting microphone permission...")
          audioRecorder.on("data", onData)
          await audioRecorder.start()
          addLog("Microphone recording started")
        } catch (error) {
          console.error("Error starting audio recording:", error)
          addLog(`Error starting microphone: ${error.message}`)
        }
      } else {
        audioRecorder.off("data", onData)
        audioRecorder.stop()
        if (muted) {
          addLog("Microphone muted")
        } else if (!connected) {
          addLog("Disconnected - microphone stopped")
        }
      }
    }

    handleAudioRecording()

    return () => {
      audioRecorder.off("data", onData)
    }
  }, [connected, client, muted, audioRecorder, addLog])

  useEffect(() => {
    if (!client) return

    // Assign direct callbacks for GeminiLiveAPI events
    client.onTurnComplete = () => addLog("Turn completed")
    client.onInterrupted = () => addLog("Audio interrupted")
    client.onSetupComplete = () => addLog("Setup completed")
    client.onError = (error) => addLog(`Error: ${error}`)
    // Optionally, you can add more logs for other events if needed

    // No cleanup needed for direct assignment, but reset to no-op on unmount
    return () => {
      if (!client) return
      client.onTurnComplete = () => {}
      client.onInterrupted = () => {}
      client.onSetupComplete = () => {}
      client.onError = () => {}
    }
  }, [client, addLog])

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Gemini Live</h1>
        <p className="text-muted-foreground">
          Interact with Gemini using your voice
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Controls</span>
            <div className="flex gap-2">
              <Button
                onClick={() => setMuted(!muted)}
                variant={muted ? "destructive" : "default"}
                size="icon"
              >
                {muted ? <MicOffIcon /> : <MicIcon />}
              </Button>
              <Button
                ref={connectButtonRef}
                variant={connected ? "destructive" : "default"}
                onClick={connected ? disconnect : connect}
              >
                {connected ? "Desconectar" : "Conectar"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {isDevelopment && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {logs.map((log, index) => (
                <div key={index} className="flex items-center py-1 text-sm">
                  <span className="text-muted-foreground font-mono w-20 flex-shrink-0">
                    {log.timestamp}
                  </span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { Meet }
