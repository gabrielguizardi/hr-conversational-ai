const environment = import.meta.env

export const isDevelopment = environment.DEV
export const isProduction = environment.PROD

export const appUrl = environment.VITE_PROJECT_URL || "http://localhost:5173"

export const apiUrl = environment.VITE_API_URL || "http://localhost:3001"
export const wsUrl = environment.VITE_WS_URL || "ws://localhost:3001"
