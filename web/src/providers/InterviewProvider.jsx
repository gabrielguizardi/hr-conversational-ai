import { useMemo } from "react"
import GeminiLiveApiProvider from "./GeminiLiveApiProvider"

const InterviewProvider = ({ children, jobVacancyId }) => {
  return (
    <GeminiLiveApiProvider jobVacancyId={jobVacancyId}>
      {children}
    </GeminiLiveApiProvider>
  )
}

export default InterviewProvider 