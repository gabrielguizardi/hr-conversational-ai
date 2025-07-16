import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import interviewQuestionsAskedApi from "@/services/api/interview-questions-asked"
import useFetch from "@/hooks/useFetch"

const InterviewQuestionsAsked = () => {
  const [filter, setFilter] = useState("all") // all, candidate, interview
  const [filterValue, setFilterValue] = useState("")

  const { data: questionsData, refetch } = useFetch(
    interviewQuestionsAskedApi.list,
    {},
    []
  )

  const questions = questionsData?.interview_questions_asked || []

  const filteredQuestions = questions.filter(question => {
    if (filter === "all") return true
    if (filter === "candidate" && filterValue) {
      return question.candidate_id === filterValue
    }
    if (filter === "interview" && filterValue) {
      return question.interview_id === filterValue
    }
    return true
  })

  const getStatusColor = (status) => {
    switch (status) {
      case "asked":
        return "bg-blue-100 text-blue-800"
      case "answered":
        return "bg-green-100 text-green-800"
      case "skipped":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Perguntas Feitas</h1>
        <p className="text-muted-foreground">
          Histórico de perguntas feitas durante as entrevistas
        </p>
      </div>

      {/* Filters */}
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="filter">Tipo de Filtro</Label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as perguntas</SelectItem>
                  <SelectItem value="candidate">Por candidato</SelectItem>
                  <SelectItem value="interview">Por entrevista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filter !== "all" && (
              <div className="flex-1">
                <Label htmlFor="filterValue">
                  {filter === "candidate" ? "ID do Candidato" : "ID da Entrevista"}
                </Label>
                <Input
                  id="filterValue"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder={filter === "candidate" ? "Digite o ID do candidato" : "Digite o ID da entrevista"}
                />
              </div>
            )}
            <Button onClick={refetch}>Atualizar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>
            Perguntas ({filteredQuestions.length} de {questions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {filteredQuestions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhuma pergunta encontrada.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <div key={question._id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            Pergunta {question.question_number}
                          </h3>
                          <Badge className={getStatusColor(question.status)}>
                            {question.status}
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-2">{question.question_text}</p>
                        <div className="text-sm text-gray-500 space-y-1">
                          {question.candidate_id && (
                            <p>Candidato: {question.candidate_id}</p>
                          )}
                          {question.interview_id && (
                            <p>Entrevista: {question.interview_id}</p>
                          )}
                          {question.job_vacancy_id && (
                            <p>Vaga: {question.job_vacancy_id}</p>
                          )}
                          <p>Feita em: {new Date(question.asked_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

export { InterviewQuestionsAsked } 