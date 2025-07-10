import { useNavigate } from "react-router"
import { PlusIcon, ArrowRightIcon } from "lucide-react"

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

import useFetch from "@/hooks/useFetch"
import jobVacanciesApi from "@/services/api/jobVacancies"
import { useMemo } from "react"

const JobVacancyList = () => {
  let navigate = useNavigate()

  const { data } = useFetch(jobVacanciesApi.list, {})

  const jobVacancies = useMemo(() => {
    return data?.job_vacancies || []
  }, [data])

  console.log("Job Vacancies:", data)

  const handleNavigateToShow = (jobVacancyId) => {
    navigate(`/job-vacancies/${jobVacancyId}/show`)
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="Vagas">
        <Button onClick={() => navigate("/job-vacancies/create")}>
          <PlusIcon /> Criar Vaga
        </Button>
      </PageHeader>

      <div className="mt-4">
        <Table>
          <TableCaption>Listagem de Vagas</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobVacancies.map((jobVacancy) => (
              <TableRow key={jobVacancy._id}>
                <TableCell>{jobVacancy.title}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleNavigateToShow(jobVacancy._id)}
                  >
                    <ArrowRightIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Job vacancies list will be rendered here */}
    </div>
  )
}

export { JobVacancyList }
