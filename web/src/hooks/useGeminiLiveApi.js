import { useContext } from "react"
import GeminiLiveApiContext from "@/contexts/geminiLiveApiContext"

export const useGeminiLiveApi = () => {
  const context = useContext(GeminiLiveApiContext)
  if (!context) {
    throw new Error("useGeminiLiveApi must be used wihin a LiveAPIProvider")
  }
  return {
    client: context.client,
    connected: context.connected,
    connect: context.connect,
    disconnect: context.disconnect,
  }
}
