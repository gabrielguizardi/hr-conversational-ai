import { createWorketFromSrc, registeredWorklets } from "./audioworkletRegistry"

export class AudioStreamer {
  constructor(audioContext) {
    this.audioContext = audioContext
    this.sampleRate = 24000
    this.bufferSize = 7680
    this.audioQueue = []
    this.isPlaying = false
    this.isStreamComplete = false
    this.checkInterval = null
    this.scheduledTime = 0
    this.initialBufferTime = 0.1 // 100ms initial buffer
    this.gainNode = this.audioContext.createGain()
    this.gainNode.connect(this.audioContext.destination)
    this.source = this.audioContext.createBufferSource()
    this.endOfQueueAudioSource = null
    this.onComplete = () => {}
    this.addPCM16 = this.addPCM16.bind(this)
  }

  async addWorklet(workletName, workletSrc, handler) {
    let workletsRecord = registeredWorklets.get(this.audioContext)
    if (workletsRecord && workletsRecord[workletName]) {
      // the worklet already exists on this audioContext
      // add the new handler to it
      workletsRecord[workletName].handlers.push(handler)
      return Promise.resolve(this)
    }

    if (!workletsRecord) {
      registeredWorklets.set(this.audioContext, {})
      workletsRecord = registeredWorklets.get(this.audioContext)
    }

    // create new record to fill in as becomes available
    workletsRecord[workletName] = { handlers: [handler] }

    const src = createWorketFromSrc(workletName, workletSrc)
    await this.audioContext.audioWorklet.addModule(src)
    const worklet = new AudioWorkletNode(this.audioContext, workletName)

    //add the node into the map
    workletsRecord[workletName].node = worklet

    return this
  }

  /**
   * Converts a Uint8Array of PCM16 audio data into a Float32Array.
   * PCM16 is a common raw audio format, but the Web Audio API generally
   * expects audio data as Float32Arrays with samples normalized between -1.0 and 1.0.
   * This function handles that conversion.
   * @param chunk The Uint8Array containing PCM16 audio data.
   * @returns A Float32Array representing the converted audio data.
   */

  _processPCM16Chunk(chunk) {
    const float32Array = new Float32Array(chunk.length / 2)
    const dataView = new DataView(chunk.buffer)

    for (let i = 0; i < chunk.length / 2; i++) {
      try {
        const int16 = dataView.getInt16(i * 2, true)
        float32Array[i] = int16 / 32768
      } catch (e) {
        console.error(e)
      }
    }
    return float32Array
  }

  addPCM16(chunk) {
    console.log("🎧 AudioStreamer.addPCM16 called - chunk size:", chunk.length, "bytes")
    this.isStreamComplete = false
    let processingBuffer = this._processPCM16Chunk(chunk)
    console.log("🔄 Processed PCM16 chunk - float32 samples:", processingBuffer.length)
    
    while (processingBuffer.length >= this.bufferSize) {
      const buffer = processingBuffer.slice(0, this.bufferSize)
      this.audioQueue.push(buffer)
      processingBuffer = processingBuffer.slice(this.bufferSize)
    }
    if (processingBuffer.length > 0) {
      this.audioQueue.push(processingBuffer)
    }
    
    console.log("📦 Audio queue length:", this.audioQueue.length)
    
    if (!this.isPlaying) {
      console.log("▶️ Starting audio playback")
      this.isPlaying = true
      this.scheduledTime =
        this.audioContext.currentTime + this.initialBufferTime
      this.scheduleNextBuffer()
    }
  }

  createAudioBuffer(audioData) {
    const audioBuffer = this.audioContext.createBuffer(
      1,
      audioData.length,
      this.sampleRate
    )
    audioBuffer.getChannelData(0).set(audioData)
    return audioBuffer
  }

  scheduleNextBuffer() {
    const SCHEDULE_AHEAD_TIME = 0.2

    while (
      this.audioQueue.length > 0 &&
      this.scheduledTime < this.audioContext.currentTime + SCHEDULE_AHEAD_TIME
    ) {
      const audioData = this.audioQueue.shift()
      const audioBuffer = this.createAudioBuffer(audioData)
      const source = this.audioContext.createBufferSource()

      if (this.audioQueue.length === 0) {
        if (this.endOfQueueAudioSource) {
          this.endOfQueueAudioSource.onended = null
        }
        this.endOfQueueAudioSource = source
        source.onended = () => {
          if (
            !this.audioQueue.length &&
            this.endOfQueueAudioSource === source
          ) {
            this.endOfQueueAudioSource = null
            this.onComplete()
          }
        }
      }

      source.buffer = audioBuffer
      source.connect(this.gainNode)
      console.log("🔊 Audio buffer scheduled - duration:", audioBuffer.duration, "seconds")
      const worklets = registeredWorklets.get(this.audioContext)

      if (worklets) {
        Object.entries(worklets).forEach(([, graph]) => {
          const { node, handlers } = graph
          if (node) {
            source.connect(node)
            node.port.onmessage = function (ev) {
              handlers.forEach((handler) => {
                handler.call(node.port, ev)
              })
            }
            node.connect(this.audioContext.destination)
          }
        })
      }
      // Ensure we never schedule in the past
      const startTime = Math.max(
        this.scheduledTime,
        this.audioContext.currentTime
      )
      source.start(startTime)
      this.scheduledTime = startTime + audioBuffer.duration
    }

    if (this.audioQueue.length === 0) {
      if (this.isStreamComplete) {
        this.isPlaying = false
        if (this.checkInterval) {
          clearInterval(this.checkInterval)
          this.checkInterval = null
        }
      } else {
        if (!this.checkInterval) {
          this.checkInterval = window.setInterval(() => {
            if (this.audioQueue.length > 0) {
              this.scheduleNextBuffer()
            }
          }, 100)
        }
      }
    } else {
      const nextCheckTime =
        (this.scheduledTime - this.audioContext.currentTime) * 1000
      setTimeout(
        () => this.scheduleNextBuffer(),
        Math.max(0, nextCheckTime - 50)
      )
    }
  }

  stop() {
    this.isPlaying = false
    this.isStreamComplete = true
    this.audioQueue = []
    this.scheduledTime = this.audioContext.currentTime

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    this.gainNode.gain.linearRampToValueAtTime(
      0,
      this.audioContext.currentTime + 0.1
    )

    setTimeout(() => {
      this.gainNode.disconnect()
      this.gainNode = this.audioContext.createGain()
      this.gainNode.connect(this.audioContext.destination)
    }, 200)
  }

  async resume() {
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume()
    }
    this.isStreamComplete = false
    this.scheduledTime = this.audioContext.currentTime + this.initialBufferTime
    this.gainNode.gain.setValueAtTime(1, this.audioContext.currentTime)
  }

  complete() {
    this.isStreamComplete = true
    this.onComplete()
  }
}
