import { Fragment, useState } from "react"
import { PlusIcon, EditIcon, TrashIcon, SaveIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

import interviewQuestionsApi from "@/services/api/interview-questions"
import useFetch from "@/hooks/useFetch"

const InterviewQuestionsDialog = ({ jobVacancyId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [formData, setFormData] = useState({
    question: "",
    category: "personal",
    difficulty: "easy",
    active: true,
    tag: "",
  })

  const { data: questionsData, refesh: refreshQuestions } = useFetch(
    interviewQuestionsApi.getByJobVacancy,
    { jobVacancyId },
    [isOpen]
  )

  const questions = questionsData?.interview_questions || []

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingQuestion) {
        await interviewQuestionsApi.update({
          id: editingQuestion._id,
          ...formData,
        })
      } else {
        await interviewQuestionsApi.create({
          ...formData,
          job_vacancy_id: jobVacancyId,
        })
      }

      setFormData({
        question: "",
        category: "personal",
        difficulty: "easy",
        active: true,
        tag: "",
      })
      setEditingQuestion(null)
      refreshQuestions()
    } catch (error) {
      console.error("Error saving question:", error)
      alert("Erro ao salvar pergunta. Tente novamente.")
    }
  }

  const handleEdit = (question) => {
    setEditingQuestion(question)
    setFormData({
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      active: question.active,
    })
  }

  const handleDelete = async (questionId) => {
    if (!confirm("Tem certeza que deseja excluir esta pergunta?")) {
      return
    }

    try {
      await interviewQuestionsApi.remove({ id: questionId })
      refreshQuestions()
    } catch (error) {
      console.error("Error deleting question:", error)
      alert("Erro ao excluir pergunta. Tente novamente.")
    }
  }

  const handleCancel = () => {
    setEditingQuestion(null)
    setFormData({
      question: "",
      category: "personal",
      difficulty: "easy",
      active: true,
      tag: "",
    })
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case "personal":
        return "bg-blue-100 text-blue-800"
      case "experience":
        return "bg-green-100 text-green-800"
      case "education":
        return "bg-purple-100 text-purple-800"
      case "skills":
        return "bg-orange-100 text-orange-800"
      case "availability":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusIcon className="h-4 w-4 mr-2" />
          Gerenciar Perguntas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Perguntas de Entrevista</DialogTitle>
          <DialogDescription>
            Gerencie as perguntas que o Gemini fará durante a entrevista.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingQuestion ? "Editar Pergunta" : "Nova Pergunta"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="question">Pergunta</Label>
                  <Textarea
                    id="question"
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                    placeholder="Digite a pergunta..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Dados Pessoais</SelectItem>
                        <SelectItem value="experience">
                          Experiência Profissional
                        </SelectItem>
                        <SelectItem value="education">
                          Formação Acadêmica
                        </SelectItem>
                        <SelectItem value="skills">Habilidades</SelectItem>
                        <SelectItem value="availability">
                          Disponibilidade
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Dificuldade</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) =>
                        setFormData({ ...formData, difficulty: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Fácil</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="hard">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tag">Tag (Nome do campo no banco)</Label>
                  <Input
                    id="tag"
                    value={formData.tag}
                    onChange={(e) =>
                      setFormData({ ...formData, tag: e.target.value })
                    }
                    placeholder="Ex: nome, idade, experiencia_anos, etc."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este será o nome do campo onde a resposta será salva no
                    banco de dados
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    <SaveIcon className="h-4 w-4 mr-2" />
                    {editingQuestion ? "Atualizar" : "Adicionar"}
                  </Button>
                  {editingQuestion && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      <XIcon className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Questions List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Perguntas Configuradas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {questions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Nenhuma pergunta configurada ainda.
                    </p>
                  ) : (
                    questions.map((question) => (
                      <div
                        key={question._id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-medium">{question.question}</p>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(question)}
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(question._id)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            className={getCategoryColor(question.category)}
                          >
                            {question.category}
                          </Badge>
                          <Badge
                            className={getDifficultyColor(question.difficulty)}
                          >
                            {question.difficulty}
                          </Badge>
                          {question.tag && (
                            <Badge variant="outline" className="text-xs">
                              Tag: {question.tag}
                            </Badge>
                          )}
                          {!question.active && (
                            <Badge variant="secondary">Inativa</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { InterviewQuestionsDialog }
