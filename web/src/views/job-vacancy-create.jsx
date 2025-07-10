import { useForm } from "react-hook-form"
import { useNavigate } from "react-router"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import jobVacanciesApi from "@/services/api/jobVacancies"

const JobVacancyCreate = () => {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      // Basic information
      title: "",
      description: "",

      // informacoes_basicas
      requestDate: "",
      contractingDeadline: "",
      isSapVacancy: "",
      client: "",
      clientRequester: "",
      companyDivision: "",
      requester: "",
      responsibleAnalyst: "",
      contractType: "",
      contractDeadline: "",
      vacancyObjective: "",
      vacancyPriority: "",
      vacancyOrigin: "",
      immediateSuperior: "",
      immediateSuperiorPhone: "",

      // perfil_vaga
      country: "Brasil",
      state: "",
      city: "",
      neighborhood: "",
      region: "",
      workplace: "",
      isPcdVacancy: "",
      minAge: "",
      maxAge: "",
      workingHours: "",
      professionalLevel: "",
      academicLevel: "",
      englishLevel: "",
      spanishLevel: "",
      otherLanguage: "",
      workingAreas: "",
      mainActivities: "",
      technicalSkills: "",
      otherObservations: "",
      travelRequired: "",
      necessaryEquipment: "",

      // beneficios
      saleValue: "",
      purchaseValue1: "",
      purchaseValue2: "",
    },
  })

  const onSubmit = async (data) => {
    const formData = {
      // Basic information for backward compatibility
      title: data.title,
      description: data.description,
      location: data.location,

      // Extended information
      informacoes_basicas: {
        data_requisicao: data.requestDate,
        limite_esperado_para_contratacao: data.contractingDeadline,
        titulo_vaga: data.title,
        vaga_sap: data.isSapVacancy,
        cliente: data.client,
        solicitante_cliente: data.clientRequester,
        empresa_divisao: data.companyDivision,
        requisitante: data.requester,
        analista_responsavel: data.responsibleAnalyst,
        tipo_contratacao: data.contractType,
        prazo_contratacao: data.contractDeadline,
        objetivo_vaga: data.vacancyObjective,
        prioridade_vaga: data.vacancyPriority,
        origem_vaga: data.vacancyOrigin,
        superior_imediato: data.immediateSuperior,
        telefone: data.immediateSuperiorPhone,
      },

      perfil_vaga: {
        pais: data.country,
        estado: data.state,
        cidade: data.city,
        bairro: data.neighborhood,
        regiao: data.region,
        local_trabalho: data.workplace,
        vaga_especifica_para_pcd: data.isPcdVacancy,
        faixa_etaria: `De: ${data.minAge} Até: ${data.maxAge}`,
        horario_trabalho: data.workingHours,
        nivel_profissional: data.professionalLevel,
        nivel_academico: data.academicLevel,
        nivel_ingles: data.englishLevel,
        nivel_espanhol: data.spanishLevel,
        outro_idioma: data.otherLanguage,
        areas_atuacao: data.workingAreas,
        principais_atividades: data.mainActivities,
        competencia_tecnicas_e_comportamentais: data.technicalSkills,
        demais_observacoes: data.otherObservations,
        viagens_requeridas: data.travelRequired,
        equipamentos_necessarios: data.necessaryEquipment,
      },

      beneficios: {
        valor_venda: data.saleValue,
        valor_compra_1: data.purchaseValue1,
        valor_compra_2: data.purchaseValue2,
      },
    }

    try {
      await jobVacanciesApi.create(formData)
      navigate("/")
    } catch (error) {
      console.error("Error creating job vacancy:", error)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="Criar Vaga" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título da Vaga</Label>
                <Input
                  id="title"
                  {...register("title", {
                    required: "Título da vaga é obrigatório",
                  })}
                  placeholder="Ex: Líder de Operações"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="requestDate">Data da Solicitação</Label>
                <Input
                  id="requestDate"
                  type="date"
                  {...register("requestDate")}
                />
              </div>
              <div>
                <Label htmlFor="contractingDeadline">
                  Prazo para Contratação
                </Label>
                <Input
                  id="contractingDeadline"
                  type="date"
                  {...register("contractingDeadline")}
                />
              </div>
              <div>
                <Label htmlFor="isSapVacancy">Vaga SAP?</Label>
                <Select
                  onValueChange={(value) => setValue("isSapVacancy", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Sim</SelectItem>
                    <SelectItem value="no">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="client">Cliente</Label>
                <Input id="client" {...register("client")} />
              </div>
              <div>
                <Label htmlFor="clientRequester">Solicitante do Cliente</Label>
                <Input id="clientRequester" {...register("clientRequester")} />
              </div>
              <div>
                <Label htmlFor="companyDivision">Divisão da Empresa</Label>
                <Input id="companyDivision" {...register("companyDivision")} />
              </div>
              <div>
                <Label htmlFor="requester">Requisitante</Label>
                <Input id="requester" {...register("requester")} />
              </div>
              <div>
                <Label htmlFor="responsibleAnalyst">Analista Responsável</Label>
                <Input
                  id="responsibleAnalyst"
                  {...register("responsibleAnalyst")}
                />
              </div>
              <div>
                <Label htmlFor="contractType">Tipo de Contrato</Label>
                <Select
                  onValueChange={(value) => setValue("contractType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clt-integral">CLT Integral</SelectItem>
                    <SelectItem value="clt-meio-periodo">
                      CLT Meio Período
                    </SelectItem>
                    <SelectItem value="pessoa-juridica">
                      Pessoa Jurídica
                    </SelectItem>
                    <SelectItem value="estagio">Estágio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="vacancyPriority">Prioridade da Vaga</Label>
                <Select
                  onValueChange={(value) => setValue("vacancyPriority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vacancyOrigin">Origem da Vaga</Label>
                <Input
                  id="vacancyOrigin"
                  {...register("vacancyOrigin")}
                  placeholder="Ex: Interna, Externa"
                />
              </div>
              <div>
                <Label htmlFor="immediateSuperior">Superior Imediato</Label>
                <Input
                  id="immediateSuperior"
                  {...register("immediateSuperior")}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="immediateSuperiorPhone">
                  Telefone do Superior Imediato
                </Label>
                <Input
                  id="immediateSuperiorPhone"
                  {...register("immediateSuperiorPhone")}
                  placeholder="Telefone"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vacancyObjective">Objetivo da Vaga</Label>
              <Textarea
                id="vacancyObjective"
                {...register("vacancyObjective")}
                placeholder="Descreva o objetivo da vaga..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição da Vaga</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Descreva os detalhes da vaga..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Perfil da Vaga */}
        <Card>
          <CardHeader>
            <CardTitle>Perfil da Vaga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  {...register("country")}
                  placeholder="Brasil"
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  {...register("state")}
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  {...register("neighborhood")}
                  placeholder="Bairro"
                />
              </div>
              <div>
                <Label htmlFor="region">Região</Label>
                <Input
                  id="region"
                  {...register("region")}
                  placeholder="Região"
                />
              </div>
              <div>
                <Label htmlFor="workplace">Local de Trabalho</Label>
                <Input
                  id="workplace"
                  {...register("workplace")}
                  placeholder="Ex: 2000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Tipo de Trabalho</Label>
                <Select onValueChange={(value) => setValue("location", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de trabalho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remoto">Remoto</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="isPcdVacancy">Vaga para PCD?</Label>
                <Select
                  onValueChange={(value) => setValue("isPcdVacancy", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minAge">Idade Mínima</Label>
                <Input
                  id="minAge"
                  type="number"
                  {...register("minAge")}
                  placeholder="Idade mínima"
                />
              </div>
              <div>
                <Label htmlFor="maxAge">Idade Máxima</Label>
                <Input
                  id="maxAge"
                  type="number"
                  {...register("maxAge")}
                  placeholder="Idade máxima"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="professionalLevel">Nível Profissional</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("professionalLevel", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analista">Analista</SelectItem>
                    <SelectItem value="junior">Júnior</SelectItem>
                    <SelectItem value="pleno">Pleno</SelectItem>
                    <SelectItem value="senior">Sênior</SelectItem>
                    <SelectItem value="lider">Líder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="academicLevel">Nível Acadêmico</Label>
                <Select
                  onValueChange={(value) => setValue("academicLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ensino-medio">Ensino Médio</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="graduacao">Graduação</SelectItem>
                    <SelectItem value="pos-graduacao">Pós-graduação</SelectItem>
                    <SelectItem value="especializacao">
                      Especialização
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="englishLevel">Nível de Inglês</Label>
                <Select
                  onValueChange={(value) => setValue("englishLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Nenhum</SelectItem>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                    <SelectItem value="fluente">Fluente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="spanishLevel">Nível de Espanhol</Label>
                <Select
                  onValueChange={(value) => setValue("spanishLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Nenhum</SelectItem>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                    <SelectItem value="fluente">Fluente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="otherLanguage">Outro Idioma</Label>
                <Input
                  id="otherLanguage"
                  {...register("otherLanguage")}
                  placeholder="Ex: Francês, Alemão"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="workingHours">Horário de Trabalho</Label>
              <Input
                id="workingHours"
                {...register("workingHours")}
                placeholder="Ex: 9:00 - 18:00"
              />
            </div>

            <div>
              <Label htmlFor="workingAreas">Áreas de Atuação</Label>
              <Input
                id="workingAreas"
                {...register("workingAreas")}
                placeholder="Ex: TI - Sistemas e Ferramentas"
              />
            </div>

            <div>
              <Label htmlFor="mainActivities">Principais Atividades</Label>
              <Textarea
                id="mainActivities"
                {...register("mainActivities")}
                placeholder="Descreva as principais atividades e responsabilidades..."
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="technicalSkills">
                Competências Técnicas e Comportamentais
              </Label>
              <Textarea
                id="technicalSkills"
                {...register("technicalSkills")}
                placeholder="Descreva as competências técnicas e comportamentais necessárias..."
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="otherObservations">Outras Observações</Label>
              <Textarea
                id="otherObservations"
                {...register("otherObservations")}
                placeholder="Ex: 100% Remoto, período de 5-6 meses"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="travelRequired">Viagem Necessária</Label>
                <Input
                  id="travelRequired"
                  {...register("travelRequired")}
                  placeholder="Ex: Sim, Não, Ocasionalmente"
                />
              </div>
              <div>
                <Label htmlFor="necessaryEquipment">
                  Equipamentos Necessários
                </Label>
                <Input
                  id="necessaryEquipment"
                  {...register("necessaryEquipment")}
                  placeholder="Ex: Notebook, Celular, Nenhum"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefícios */}
        <Card>
          <CardHeader>
            <CardTitle>Benefícios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="saleValue">Valor de Venda</Label>
                <Input
                  id="saleValue"
                  {...register("saleValue")}
                  placeholder="Ex: R$ 10.000"
                />
              </div>
              <div>
                <Label htmlFor="purchaseValue1">Valor de Compra 1</Label>
                <Input
                  id="purchaseValue1"
                  {...register("purchaseValue1")}
                  placeholder="Ex: R$ 8.000"
                />
              </div>
              <div>
                <Label htmlFor="purchaseValue2">Valor de Compra 2</Label>
                <Input
                  id="purchaseValue2"
                  {...register("purchaseValue2")}
                  placeholder="Ex: R$ 7.000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações do Formulário */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancelar
          </Button>
          <Button type="submit">Criar Vaga</Button>
        </div>
      </form>
    </div>
  )
}

export { JobVacancyCreate }
