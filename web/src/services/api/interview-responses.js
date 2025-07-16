import api from "@/services/api"

const list = async () => {
  try {
    return await api.get("/interview_responses")
  } catch (error) {
    console.error("Error fetching interview responses:", error)
    throw error
  }
}

const getByInterview = async ({ interviewId }) => {
  try {
    return await api.get(`/interview_responses/interview/${interviewId}`)
  } catch (error) {
    console.error("Error fetching interview responses by interview:", error)
    throw error
  }
}

const getByCandidate = async ({ candidateId }) => {
  try {
    return await api.get(`/interview_responses/candidate/${candidateId}`)
  } catch (error) {
    console.error("Error fetching interview responses by candidate:", error)
    throw error
  }
}

const interviewResponsesApi = {
  list,
  getByInterview,
  getByCandidate,
}

export default interviewResponsesApi 