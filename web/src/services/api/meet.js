import api from '../api'

const meetApi = {
  getMeetData: async (candidateId) => {
    try {
      console.log("🔍 meetApi.getMeetData - candidateId:", candidateId)
      console.log("🔍 meetApi.getMeetData - URL:", `/meet/${candidateId}`)
      const response = await api.get(`/meet/${candidateId}`)
      console.log("🔍 meetApi.getMeetData - response:", response)
      console.log("🔍 meetApi.getMeetData - response.data:", response.data)
      return response
    } catch (error) {
      console.error("🔍 meetApi.getMeetData - ERROR:", error)
      console.error("🔍 meetApi.getMeetData - error.response:", error.response)
      throw error
    }
  }
}

export default meetApi 