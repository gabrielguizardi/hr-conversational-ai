import { Fragment, useState } from "react"
import { EyeIcon, ClipboardCheckIcon, ClipboardIcon } from "lucide-react"

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
import { Alert, AlertTitle } from "@/components/ui/alert"

import { appUrl } from "@/services/application"

const ActionCandidateDialog = ({ candidate }) => {
  const [copied, setCopied] = useState(false)

  const meetLink = `${appUrl}/meet/${candidate._id}`

  const handleClickCopyButton = () => {
    navigator.clipboard.writeText(meetLink)
    if (!copied) setCopied(true)
  }

  const handleClickDownloadButton = () => {
    const dataStr = JSON.stringify(candidate, null, 2)
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `candidate-${candidate._id}-data.json`
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <EyeIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {(candidate?.status === "initial" || !candidate?.status) && (
          <Fragment>
            <DialogHeader>
              <DialogTitle>Entrevista</DialogTitle>
              <DialogDescription>
                Copie o link da reunião e envie para o candidato, para que ele
                possa participar da entrevista.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <Label htmlFor="meet-link">Link de Reunião</Label>
              <div className="flex items-center gap-2">
                <Input id="meet-link" value={meetLink} readOnly />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleClickCopyButton}
                >
                  <ClipboardIcon />
                </Button>
              </div>
              {copied && (
                <Alert variant="success">
                  <ClipboardCheckIcon />
                  <AlertTitle>Link copiado com sucesso</AlertTitle>
                </Alert>
              )}
            </div>
          </Fragment>
        )}
        {candidate?.status === "finalized" && (
          <Fragment>
            <DialogHeader>
              <DialogTitle>Dados da entrevista</DialogTitle>
              <DialogDescription>
                Aqui estão os dados da entrevista do candidato. Você pode
                revisar as informações e tomar uma decisão sobre o próximo
                passo.
              </DialogDescription>

              <div className="grid gap-4 mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleClickDownloadButton}
                >
                  Download dos dados (JSON)
                </Button>
              </div>
            </DialogHeader>
          </Fragment>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { ActionCandidateDialog }
