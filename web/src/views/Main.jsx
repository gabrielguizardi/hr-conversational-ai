import { useGeminiLiveApi } from "@/hooks/useGeminiLiveApi"
import { AudioRecorder } from "@/helpers/audioRecorder"
import { useEffect, useRef, useState, useCallback } from "react"
import styles from "./Main.module.css"

const Main = () => {
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
    <div className={styles.mainContainer}>
      <h1 className={styles.title}>Gemini Live</h1>

      <button
        onClick={() => setMuted(!muted)}
        className={`${styles.button} ${muted ? styles.muted : ""}`}
      >
        {muted ? "Unmute" : "Mute"}
      </button>

      <button
        ref={connectButtonRef}
        onClick={connected ? disconnect : connect}
        className={`${styles.button} ${connected ? styles.disconnect : ""}`}
      >
        {connected ? "Disconnect" : "Connect"}
      </button>

      {/* Logs para debug */}
      <div className={styles.logsContainer}>
        <h3>Activity Log:</h3>
        <div className={styles.logs}>
          {logs.map((log, index) => (
            <div key={index} className={styles.logEntry}>
              <span className={styles.timestamp}>{log.timestamp}</span>
              <span className={styles.message}>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Main
