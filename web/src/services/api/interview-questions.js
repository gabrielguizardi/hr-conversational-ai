import api from "@/services/api"

const list = async () => {
  try {
    return await api.get("/interview_questions")
  } catch (error) {
    console.error("Error fetching interview questions:", error)
    throw error
  }
}

const show = async ({ id }) => {
  try {
    return await api.get(`/interview_questions/${id}`)
  } catch (error) {
    console.error("Error fetching interview question:", error)
    throw error
  }
}

const create = async (data) => {
  try {
    return await api.post("/interview_questions", data)
  } catch (error) {
    console.error("Error creating interview question:", error)
    throw error
  }
}

const update = async ({ id, ...data }) => {
  try {
    return await api.put(`/interview_questions/${id}`, data)
  } catch (error) {
    console.error("Error updating interview question:", error)
    throw error
  }
}

const remove = async ({ id }) => {
  try {
    return await api.delete(`/interview_questions/${id}`)
  } catch (error) {
    console.error("Error deleting interview question:", error)
    throw error
  }
}

const getByJobVacancy = async ({ jobVacancyId }) => {
  try {
    return await api.get(`/interview_questions/job_vacancy/${jobVacancyId}`)
  } catch (error) {
    console.error("Error fetching interview questions by job vacancy:", error)
    throw error
  }
}

export default {
  list,
  show,
  create,
  update,
  remove,
  getByJobVacancy,
} 