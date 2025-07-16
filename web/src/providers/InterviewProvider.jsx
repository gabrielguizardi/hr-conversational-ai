import { useMemo } from "react"
import GeminiLiveApiProvider from "./GeminiLiveApiProvider"

const InterviewProvider = ({ children, jobVacancyId, jobCandidateId }) => {
  return (
    <GeminiLiveApiProvider jobVacancyId={jobVacancyId} jobCandidateId={jobCandidateId}>
      {children}
    </GeminiLiveApiProvider>
  )
}

export default InterviewProvider 