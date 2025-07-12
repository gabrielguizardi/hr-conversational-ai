import api from "@/services/api"

const create = async (data) => {
  try {
    return await api.post("/interviews", data)
  } catch (error) {
    console.error("Error creating interview:", error)
    throw error
  }
}

const show = async ({ id }) => {
  try {
    return await api.get(`/interviews/${id}`)
  } catch (error) {
    console.error("Error fetching interview:", error)
    throw error
  }
}

const updateResponses = async ({ id, responses, status }) => {
  try {
    return await api.put(`/interviews/${id}/responses`, { responses, status })
  } catch (error) {
    console.error("Error updating interview responses:", error)
    throw error
  }
}

const getByCandidate = async ({ candidateId }) => {
  try {
    return await api.get(`/interviews/candidate/${candidateId}`)
  } catch (error) {
    console.error("Error fetching interviews by candidate:", error)
    throw error
  }
}

export default {
  create,
  show,
  updateResponses,
  getByCandidate,
} 