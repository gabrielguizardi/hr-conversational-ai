import api from "@/services/api"

const list = async () => {
  try {
    return await api.get("/job_vacancies")
  } catch (error) {
    console.error("Error fetching job vacancies:", error)
    throw error
  }
}

const show = async ({ id }) => {
  try {
    return await api.get(`/job_vacancies/${id}`)
  } catch (error) {
    console.error(`Error fetching job vacancy with ID ${id}:`, error)
    throw error
  }
}

const create = async (data) => {
  try {
    return await api.post("/job_vacancies", data)
  } catch (error) {
    console.error("Error creating job vacancy:", error)
    throw error
  }
}

export default {
  list,
  show,
  create,
}
