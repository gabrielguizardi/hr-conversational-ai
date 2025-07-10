import axios from "axios"
import { apiUrl } from "./application"

const instance = axios.create({
  baseURL: apiUrl,
})

export default instance
