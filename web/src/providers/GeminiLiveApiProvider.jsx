import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import GeminiLiveApiContext from "@/contexts/geminiLiveApiContext"
import { GeminiLiveAPI } from "@/helpers/geminiLiveAPI"
import { audioContext, base64ToArrayBuffer } from "@/helpers/utils"
import { AudioStreamer } from "@/helpers/audioStreamer"

import { wsUrl } from "@/services/application"

const GeminiLiveApiProvider = ({ children }) => {
  const proxyUrl = `${wsUrl}/ws`

  const client = useMemo(() => new GeminiLiveAPI(proxyUrl), [proxyUrl])
  const audioStreamerRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" }).then((audioCtx) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx)
      })
    }
  }, [audioStreamerRef])

  useEffect(() => {
    const currentTimeout = reconnectTimeoutRef.current

    // Callback assignments for GeminiLiveAPI
    client.onSetupComplete = () => {
      console.log("Setup completed - setting connected to true")
      setConnected(true)
    }
    client.onAudioData = (base64Audio) => {
      const arrayBuffer = base64ToArrayBuffer(base64Audio)
      audioStreamerRef.current?.addPCM16(new Uint8Array(arrayBuffer))
    }
    client.onInterrupted = () => {
      audioStreamerRef.current?.stop()
    }
    client.onError = (error) => {
      console.error("error", error)
    }
    client.onClose = () => {
      console.log("WebSocket closed - setting connected to false")
      setConnected(false)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }

    // Clean up: reset all callbacks to no-ops (do not call client.disconnect here)
    return () => {
      if (currentTimeout) {
        clearTimeout(currentTimeout)
      }
      client.onSetupComplete = () => {}
      client.onAudioData = () => {}
      client.onInterrupted = () => {}
      client.onError = () => {}
      client.onClose = () => {}
      client.onToolCall = () => {}
      // Do not call client.disconnect() here; disconnect is handled by the context method
    }
  }, [client])

  const connect = useCallback(async () => {
    console.log("Connect button clicked - disconnecting first...")
    setConnected(false)
    client.disconnect()
    console.log("Attempting to connect to WebSocket...")
    try {
      client.connect()
      console.log("WebSocket connection initiated")
    } catch (error) {
      console.error("Connection failed:", error)
      setConnected(false)
      if (error.message && error.message.includes("1006")) {
        alert(
          "Erro: Servidor proxy não está respondendo. Verifique se seu proxy está rodando e acessível."
        )
      }
    }
  }, [client])

  const disconnect = useCallback(async () => {
    client.disconnect()
    setConnected(false)
  }, [setConnected, client])

  return (
    <GeminiLiveApiContext.Provider
      value={{
        client,
        connected,
        connect,
        disconnect,
      }}
    >
      {children}
    </GeminiLiveApiContext.Provider>
  )
}

export default GeminiLiveApiProvider
