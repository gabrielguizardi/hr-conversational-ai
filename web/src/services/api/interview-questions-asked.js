import api from "@/services/api"

const list = async () => {
  try {
    return await api.get("/interview_questions_asked")
  } catch (error) {
    console.error("Error fetching interview questions asked:", error)
    throw error
  }
}

const getByInterview = async ({ interviewId }) => {
  try {
    return await api.get(`/interview_questions_asked/interview/${interviewId}`)
  } catch (error) {
    console.error("Error fetching interview questions asked by interview:", error)
    throw error
  }
}

const getByCandidate = async ({ candidateId }) => {
  try {
    return await api.get(`/interview_questions_asked/candidate/${candidateId}`)
  } catch (error) {
    console.error("Error fetching interview questions asked by candidate:", error)
    throw error
  }
}

const interviewQuestionsAskedApi = {
  list,
  getByInterview,
  getByCandidate,
}

export default interviewQuestionsAskedApi 