import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import candidatesApi from "@/services/api/candidates"

const AddCandidateDialog = ({ jobVacancyId, refresh = () => {} }) => {
  const [open, setOpen] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  const onSubmit = async (e) => {
    e.preventDefault()

    const formData = {
      name,
      email,
      status: "initial",
      jobVacancyId,
    }

    try {
      await candidatesApi.create(formData)
      setOpen(false)
      refresh()
    } catch (error) {
      console.error("Error creating job vacancy:", error)
      return
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form id="add-candidate-form" onSubmit={onSubmit}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <PlusIcon />
            Adicionar Candidato
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Candidato</DialogTitle>
            <DialogDescription>
              Adicione as informações do candidato para a vaga, depois copie o
              link da reunião e envie para ele.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="candidate-name">Nome</Label>
              <Input
                id="candidate-name"
                name="name"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="candidate-email">E-mail</Label>
              <Input
                id="candidate-email"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" form="add-candidate-form">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}

export { AddCandidateDialog }
