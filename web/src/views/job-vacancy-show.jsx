import { useParams } from "react-router"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { AddCandidateDialog } from "@/components/job-vacancy-show/add-candidate-dialog"
import { ActionCandidateDialog } from "@/components/job-vacancy-show/action-candidate-dialog"
import { InterviewQuestionsDialog } from "@/components/job-vacancy-show/interview-questions-dialog"

import useFetch from "@/hooks/useFetch"

import jobVacanciesApi from "@/services/api/jobVacancies"
import candidatesApi from "@/services/api/candidates"

const JobVacancyShow = () => {
  const { jobVacancyId } = useParams()

  // let navigate = useNavigate()

  const { data: jobVacancyData } = useFetch(jobVacanciesApi.show, {
    id: jobVacancyId,
  })
  const { data: candidatesData, refesh: refreshCandidates } = useFetch(
    candidatesApi.list,
    {
      jobVacancyId: jobVacancyId,
    }
  )

  const jobVacancy = jobVacancyData?.job_vacancy || {}
  const candidates = candidatesData?.candidates || []

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="Visualizar Vaga" />

      <div className="mt-4 w-full">
        <div className="space-y-8">
          <div className="rounded-lg border p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 capitalize">
              {jobVacancy?.title || "-"}
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Descrição da Vaga
                </h3>
                <p className="mt-1 whitespace-pre-wrap capitalize">
                  {jobVacancy?.description || "-"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Localização
                  </h3>
                  <p className="mt-1 capitalize">
                    {jobVacancy?.location || "-"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Voltar
              </Button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Candidaturas</h2>
              <div className="flex gap-2">
                <InterviewQuestionsDialog jobVacancyId={jobVacancyId} />
                <AddCandidateDialog
                  jobVacancyId={jobVacancyId}
                  refresh={refreshCandidates}
                />
              </div>
            </div>

            <Table>
              <TableCaption>Lista de candidatos para esta vaga.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Candidatura</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate._id}>
                    <TableCell className="font-medium capitalize">
                      {candidate.name}
                    </TableCell>
                    <TableCell>{candidate.email}</TableCell>
                    <TableCell>
                      {candidate.status ? (
                        <Badge
                          variant={
                            candidate.status === "initial"
                              ? "default"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {candidate.status}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{candidate.applicationDate || "-"}</TableCell>
                    <TableCell className="text-right">
                      <ActionCandidateDialog candidate={candidate} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}

export { JobVacancyShow }
