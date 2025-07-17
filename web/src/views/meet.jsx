import { useParams } from "react-router"
import { useEffect, useRef, useState, useCallback } from "react"
import { MicIcon, MicOffIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

import InterviewProvider from "@/providers/InterviewProvider"

import { useGeminiLiveApi } from "@/hooks/useGeminiLiveApi"
import useFetch from "@/hooks/useFetch"

import { AudioRecorder } from "@/helpers/audioRecorder"
import { isDevelopment } from "@/services/application"
import candidatesApi from "@/services/api/candidates"
import interviewsApi from "@/services/api/interviews"
import interviewQuestionsAskedApi from "@/services/api/interview-questions-asked"
import interviewResponsesApi from "@/services/api/interview-responses"

const MeetContent = ({ meetData }) => {
  const { jobCandidateId } = useParams()
  const [audioRecorder] = useState(() => new AudioRecorder())
  const [muted, setMuted] = useState(false)
  const [logs, setLogs] = useState([])
  const [interviewId, setInterviewId] = useState(null)
  const [responses, setResponses] = useState({})
  const [isInterviewStarted, setIsInterviewStarted] = useState(false)
  const [questionsAsked, setQuestionsAsked] = useState([])
  const [savedResponses, setSavedResponses] = useState([])
  const connectButtonRef = useRef(null)

  const candidate = meetData?.candidate || {}
  const jobVacancyId = candidate?.job_vacancy_id

  // Fetch questions asked during this interview
  const { data: questionsAskedData } = useFetch(
    () =>
      interviewQuestionsAskedApi.getByCandidate({
        candidateId: jobCandidateId,
      }),
    {},
    [jobCandidateId]
  )

  // Fetch responses for this candidate
  const { data: responsesData } = useFetch(
    interviewResponsesApi.getByCandidate,
    { candidateId: jobCandidateId },
    [jobCandidateId]
  )

  // Update questions asked state when data changes
  useEffect(() => {
    if (questionsAskedData?.interview_questions_asked) {
      setQuestionsAsked(questionsAskedData.interview_questions_asked)
    }
  }, [questionsAskedData])

  // Update saved responses state when data changes
  useEffect(() => {
    if (responsesData?.interview_responses) {
      setSavedResponses(responsesData.interview_responses)
    }
  }, [responsesData])

  const { client, connected, connect, disconnect } = useGeminiLiveApi()

  const addLog = useCallback((message) => {
    setLogs((prev) => [
      ...prev.slice(-9), // Mantém apenas os últimos 10 logs
      { timestamp: new Date().toLocaleTimeString(), message },
    ])
  }, [])

  // Start interview session
  const startInterview = useCallback(async () => {
    if (!jobCandidateId || !jobVacancyId) {
      addLog("Erro: Dados do candidato ou vaga não encontrados")
      return
    }

    try {
      const response = await interviewsApi.create({
        candidate_id: jobCandidateId,
        job_vacancy_id: jobVacancyId,
      })
      setInterviewId(response.data.interview._id)
      setIsInterviewStarted(true)
      addLog("Entrevista iniciada - ID: " + response.data.interview._id)
    } catch (error) {
      console.error("Error starting interview:", error)
      addLog("Erro ao iniciar entrevista: " + error.message)
    }
  }, [jobCandidateId, jobVacancyId, addLog])

  // Save responses to database
  const saveResponses = useCallback(
    async (newResponses, status = "in_progress") => {
      if (!interviewId) {
        addLog("Erro: ID da entrevista não encontrado")
        return
      }

      try {
        await interviewsApi.updateResponses({
          id: interviewId,
          responses: newResponses,
          status,
        })
        addLog(`Respostas salvas - Status: ${status}`)
      } catch (error) {
        console.error("Error saving responses:", error)
        addLog("Erro ao salvar respostas: " + error.message)
      }
    },
    [interviewId, addLog]
  )

  useEffect(() => {
    const onData = (base64) => {
      console.log(
        "📤 Sending audio chunk to Gemini - base64 length:",
        base64.length
      )
      if (client && typeof client.sendAudioChunk === "function") {
        client.sendAudioChunk(base64)
      } else {
        console.error("❌ Client or sendAudioChunk not available")
      }
    }

    const handleAudioRecording = async () => {
      if (connected && !muted && audioRecorder) {
        try {
          addLog("Requesting microphone permission...")
          audioRecorder.on("data", onData)
          await audioRecorder.start()
          addLog("Microphone recording started")
        } catch (error) {
          console.error("Error starting audio recording:", error)
          addLog(`Error starting microphone: ${error.message}`)
        }
      } else {
        audioRecorder.off("data", onData)
        audioRecorder.stop()
        if (muted) {
          addLog("Microphone muted")
        } else if (!connected) {
          addLog("Disconnected - microphone stopped")
        }
      }
    }

    handleAudioRecording()

    return () => {
      audioRecorder.off("data", onData)
    }
  }, [connected, client, muted, audioRecorder, addLog])

  useEffect(() => {
    if (!client) return

    // Assign direct callbacks for GeminiLiveAPI events
    client.onTurnComplete = () => {
      addLog("Turn completed")
      // Save responses periodically
      if (Object.keys(responses).length > 0) {
        saveResponses(responses)
      }
    }
    client.onInterrupted = () => addLog("Audio interrupted")
    client.onSetupComplete = () => {
      addLog("Setup completed")
      // Start interview when setup is complete
      if (!isInterviewStarted) {
        startInterview()
      }
    }
    client.onError = (error) => addLog(`Error: ${error}`)

    // Handle tool calls for response collection
    client.onToolCall = (toolCall) => {
      if (toolCall.function_name === "save_response") {
        const args = toolCall.args
        const newResponses = { ...responses, [args.tag]: args.response }
        setResponses(newResponses)
        addLog(`Resposta salva: ${args.tag} = ${args.response}`)
      }
    }

    // No cleanup needed for direct assignment, but reset to no-op on unmount
    return () => {
      if (!client) return
      client.onTurnComplete = () => {}
      client.onInterrupted = () => {}
      client.onSetupComplete = () => {}
      client.onError = () => {}
      client.onToolCall = () => {}
    }
  }, [client, addLog])

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Gemini Live</h1>
        <p className="text-muted-foreground">
          Interact with Gemini using your voice
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Controls</span>
            <div className="flex gap-2">
              <Button
                onClick={() => setMuted(!muted)}
                variant={muted ? "destructive" : "default"}
                size="icon"
              >
                {muted ? <MicOffIcon /> : <MicIcon />}
              </Button>
              <Button
                ref={connectButtonRef}
                variant={connected ? "destructive" : "default"}
                onClick={connected ? disconnect : connect}
              >
                {connected ? "Desconectar" : "Conectar"}
              </Button>
              {connected && isInterviewStarted && (
                <Button
                  variant="outline"
                  onClick={() => saveResponses(responses, "completed")}
                >
                  Finalizar Entrevista
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {isDevelopment && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {logs.map((log, index) => (
                <div key={index} className="flex items-center py-1 text-sm">
                  <span className="text-muted-foreground font-mono w-20 flex-shrink-0">
                    {log.timestamp}
                  </span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {questionsAsked.length > 0 && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Perguntas Feitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {questionsAsked.map((question) => (
                <div
                  key={question._id}
                  className="flex justify-between items-start p-2 bg-blue-50 rounded"
                >
                  <div className="flex-1">
                    <span className="font-medium text-sm">
                      Pergunta {question.question_number}:
                    </span>
                    <p className="text-sm text-gray-700 mt-1">
                      {question.question_text}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(question.asked_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {savedResponses.length > 0 && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Respostas Salvas no Banco</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedResponses.map((response) => (
                <div
                  key={response._id}
                  className="flex justify-between items-start p-2 bg-green-50 rounded"
                >
                  <div className="flex-1">
                    <span className="font-medium text-sm">{response.tag}:</span>
                    <p className="text-sm text-gray-700 mt-1">
                      {response.response}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(response.answered_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isInterviewStarted && Object.keys(responses).length > 0 && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Respostas Coletadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(responses).map(([tag, response]) => (
                <div
                  key={tag}
                  className="flex justify-between items-start p-2 bg-gray-50 rounded"
                >
                  <span className="font-medium text-sm">{tag}:</span>
                  <span className="text-sm text-gray-700 max-w-xs">
                    {response}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const Meet = () => {
  const { jobCandidateId } = useParams()

  console.log(
    "🔍 Meet - Component rendered with jobCandidateId:",
    jobCandidateId
  )

  // Fetch meet data (candidate, job vacancy, and interview questions)
  const {
    data: meetData,
    error,
    loading,
  } = useFetch(candidatesApi.meet, { id: jobCandidateId }, [jobCandidateId])

  const candidate = meetData?.candidate || {}
  const jobVacancyId = candidate?.job_vacancy_id

  // Debug logs
  console.log("🔍 Meet - jobCandidateId:", jobCandidateId)
  console.log("🔍 Meet - meetData:", meetData)
  console.log("🔍 Meet - error:", error)
  console.log("🔍 Meet - loading:", loading)
  console.log("🔍 Meet - candidate:", candidate)
  console.log("🔍 Meet - jobVacancyId:", jobVacancyId)

  // Show loading if data is not yet loaded
  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        Carregando dados do candidato...
      </div>
    )
  }

  // Show error if there's an error
  if (error) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="text-red-600">
          Erro ao carregar dados do candidato: {error.message}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Candidate ID: {jobCandidateId}
        </div>
      </div>
    )
  }

  // Show error if candidate has no job_vacancy_id
  if (!jobVacancyId) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="text-red-600">
          Erro: Candidato não possui vaga de emprego associada.
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Candidate ID: {jobCandidateId}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Candidate data: {JSON.stringify(candidate, null, 2)}
        </div>
      </div>
    )
  }

  return (
    <InterviewProvider
      jobVacancyId={jobVacancyId}
      jobCandidateId={jobCandidateId}
    >
      <MeetContent meetData={meetData} />
    </InterviewProvider>
  )
}

export { Meet }
