import GeminiLiveApiProvider from "@/providers/GeminiLiveApiProvider"
import Main from "@/views/Main"

const App = () => {
  // Configuração apenas para WebSocket proxy
  const proxyUrl = import.meta.env.VITE_PROXY_URL || "ws://localhost:3001"

  return (
    <div className="App">
      <GeminiLiveApiProvider proxyUrl={proxyUrl}>
        <Main />
      </GeminiLiveApiProvider>
    </div>
  )
}

export default App
