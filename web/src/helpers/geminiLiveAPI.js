class GeminiLiveAPI {
  constructor(endpoint) {
    this.endpoint = endpoint
    this.ws = null
    this.onSetupComplete = () => {}
    this.onAudioData = () => {}
    this.onInterrupted = () => {}
    this.onTurnComplete = () => {}
    this.onError = () => {}
    this.onClose = () => {}
    this.onToolCall = () => {}
    this.isSetupSent = false
  }

  connect() {
    this.ws = new WebSocket(this.endpoint)
    this.setupWebSocket()
  }

  disconnect() {
    if (this.ws) {
      try {
        this.ws.close()
      } catch (e) {
        // ignore errors on close
      }
      this.ws = null
      this.isSetupSent = false
    }
  }

  setupWebSocket() {
    if (!this.ws) return
    this.ws.onopen = () => {
      console.log("WebSocket connection is opening...")
      // Backend will handle setup configuration
      this.sendSetupRequest()
    }

    this.ws.onmessage = async (event) => {
      try {
        let wsResponse
        if (event.data instanceof Blob) {
          const responseText = await event.data.text()
          wsResponse = JSON.parse(responseText)
        } else {
          wsResponse = JSON.parse(event.data)
        }

        console.log("📨 WebSocket Response received:", {
          hasAuthComplete: !!wsResponse.authComplete,
          hasSetupComplete: !!wsResponse.setupComplete,
          hasToolCall: !!wsResponse.toolCall,
          hasServerContent: !!wsResponse.serverContent,
          hasAudioData: !!(wsResponse.serverContent?.modelTurn?.parts?.[0]?.inlineData),
          turnComplete: wsResponse.serverContent?.turnComplete
        })

        if (wsResponse.authComplete) {
          console.log("Auth completed, connection ready")
          return
        }

        if (wsResponse.setupComplete) {
          this.onSetupComplete()
        } else if (wsResponse.toolCall) {
          this.onToolCall(wsResponse.toolCall)
        } else if (wsResponse.serverContent) {
          if (wsResponse.serverContent.interrupted) {
            this.onInterrupted()
            return
          }

          if (wsResponse.serverContent.modelTurn?.parts?.[0]?.inlineData) {
            const audioData =
              wsResponse.serverContent.modelTurn.parts[0].inlineData.data
            console.log("🎵 Audio data received from Gemini - base64 length:", audioData.length)
            this.onAudioData(audioData)

            if (!wsResponse.serverContent.turnComplete) {
              this.sendContinueSignal()
            }
          }

          if (wsResponse.serverContent.turnComplete) {
            this.onTurnComplete()
          }
        }
      } catch (error) {
        console.error("Error parsing response:", error)
        this.onError("Error parsing response: " + error.message)
      }
    }

    this.ws.onerror = (error) => {
      console.error("WebSocket Error:", error)
      this.onError("WebSocket Error: " + error.message)
    }

    this.ws.onclose = (event) => {
      console.log("Connection closed:", event)
      this.onClose(event)
    }
  }

  sendMessage(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error("WebSocket is not open. Current state:", this.ws.readyState)
      this.onError("WebSocket is not ready. Please try again.")
    }
  }

  sendSetupRequest(jobVacancyId = null) {
    // Send a minimal setup request - backend will handle the actual configuration
    const setupMessage = {
      setup: {},
    }

    // Add job vacancy ID if provided
    if (jobVacancyId) {
      setupMessage.setup.job_vacancy_id = jobVacancyId
    }

    if (this.ws.readyState === WebSocket.OPEN) {
      console.log("Sending setup request to backend", setupMessage)
      this.ws.send(JSON.stringify(setupMessage))
      this.isSetupSent = true
    }
  }

  sendAudioChunk(base64Audio) {
    const message = {
      realtime_input: {
        media_chunks: [
          {
            mime_type: "audio/pcm",
            data: base64Audio,
          },
        ],
      },
    }
    console.log("📡 WebSocket sending audio chunk - data length:", base64Audio.length)
    this.sendMessage(message)
  }

  sendEndMessage() {
    const message = {
      client_content: {
        turns: [
          {
            role: "user",
            parts: [],
          },
        ],
        turn_complete: true,
      },
    }
    this.sendMessage(message)
  }

  sendContinueSignal() {
    const message = {
      client_content: {
        turns: [
          {
            role: "user",
            parts: [],
          },
        ],
        turn_complete: false,
      },
    }
    this.sendMessage(message)
  }

  sendToolResponse(functionResponses) {
    const toolResponse = {
      tool_response: {
        function_responses: functionResponses,
      },
    }
    console.log("Sending tool response:", toolResponse)
    this.sendMessage(toolResponse)
  }

  async ensureConnected() {
    if (this.ws.readyState === WebSocket.OPEN) {
      return
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"))
      }, 5000)

      const onOpen = () => {
        clearTimeout(timeout)
        this.ws.removeEventListener("open", onOpen)
        this.ws.removeEventListener("error", onError)
        resolve()
      }

      const onError = (error) => {
        clearTimeout(timeout)
        this.ws.removeEventListener("open", onOpen)
        this.ws.removeEventListener("error", onError)
        reject(error)
      }

      this.ws.addEventListener("open", onOpen)
      this.ws.addEventListener("error", onError)
    })
  }
}

export { GeminiLiveAPI }
