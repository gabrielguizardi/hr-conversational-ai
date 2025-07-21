import axios from "axios"
import { apiUrl } from "./application"

const instance = axios.create({
  baseURL: apiUrl,
})

// Add request interceptor for debugging
instance.interceptors.request.use(
  (config) => {
    console.log("🔍 API Request:", config.method?.toUpperCase(), config.url)
    console.log("🔍 API Request config:", config)
    return config
  },
  (error) => {
    console.error("🔍 API Request Error:", error)
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging
instance.interceptors.response.use(
  (response) => {
    console.log("🔍 API Response:", response.status, response.config.url)
    console.log("🔍 API Response data:", response.data)
    return response
  },
  (error) => {
    console.error("🔍 API Response Error:", error)
    console.error("🔍 API Response Error config:", error.config)
    console.error("🔍 API Response Error response:", error.response)
    return Promise.reject(error)
  }
)

export default instance
