# Funcionalidade de Perguntas de Pré-Entrevista

Esta funcionalidade permite configurar perguntas específicas que o Gemini deve fazer durante pré-entrevistas de emprego, focadas em coletar dados do currículo do candidato e gravar as respostas no banco de dados.

## Funcionalidades Implementadas

### 1. Backend (Server)

#### Endpoints de Perguntas de Pré-Entrevista:
- `GET /interview_questions` - Lista todas as perguntas
- `POST /interview_questions` - Cria uma nova pergunta
- `PUT /interview_questions/{question_id}` - Atualiza uma pergunta
- `DELETE /interview_questions/{question_id}` - Remove uma pergunta
- `GET /interview_questions/job_vacancy/{job_vacancy_id}` - Lista perguntas de uma vaga específica

#### Endpoints de Entrevistas:
- `POST /interviews` - Cria uma nova sessão de entrevista
- `PUT /interviews/{interview_id}/responses` - Atualiza respostas da entrevista
- `GET /interviews/{interview_id}` - Busca entrevista por ID
- `GET /interviews/candidate/{candidate_id}` - Lista entrevistas de um candidato

#### Endpoint de Candidato:
- `GET /candidates/{candidate_id}` - Busca candidato por ID

#### Modificações no Proxy:
- O proxy agora busca perguntas de pré-entrevista baseadas no `job_vacancy_id`
- Inclui as perguntas e tags no contexto enviado para o Gemini
- Usa prompt específico para pré-entrevistas quando há perguntas configuradas
- Mapeia perguntas para tags para facilitar a coleta de respostas

### 2. Frontend (Web)

#### Componentes:
- `InterviewQuestionsDialog` - Interface para gerenciar perguntas
- `InterviewProvider` - Provider que inclui jobVacancyId no contexto

#### Serviços:
- `interview-questions.js` - API para gerenciar perguntas
- `interviews.js` - API para gerenciar entrevistas e respostas
- Atualização em `candidates.js` - Adicionado método `show`

#### Páginas:
- Atualização em `job-vacancy-show.jsx` - Botão para gerenciar perguntas
- Atualização em `meet.jsx` - Usa InterviewProvider com jobVacancyId

## Como Usar

### 1. Configurar Perguntas para uma Vaga

1. Acesse a página de visualização da vaga
2. Clique no botão "Gerenciar Perguntas"
3. Adicione perguntas com:
   - **Pergunta**: Texto da pergunta (ex: "Qual seu nome completo?")
   - **Categoria**: Dados Pessoais, Experiência Profissional, Formação Acadêmica, Habilidades, Disponibilidade
   - **Dificuldade**: Fácil, Médio, Difícil
   - **Tag**: Nome do campo no banco (ex: "nome", "idade", "experiencia_anos")
   - **Status**: Ativa/Inativa

### 2. Realizar Pré-Entrevista

1. Acesse o link de entrevista do candidato
2. O sistema automaticamente:
   - Cria uma sessão de entrevista no banco
   - Busca as perguntas configuradas para a vaga
   - Configura o Gemini com o contexto de pré-entrevista
   - Inclui as perguntas no prompt do assistente
3. Durante a entrevista:
   - As respostas são coletadas e salvas em tempo real
   - O candidato pode ver as respostas coletadas
   - Ao finalizar, todas as respostas são salvas no banco

### 3. Comportamento do Gemini

Quando há perguntas configuradas, o Gemini:
- Conduz a pré-entrevista de forma profissional
- Faz as perguntas de forma natural e conversacional
- Coleta informações básicas do currículo do candidato
- Faz uma pergunta por vez e aguarda resposta completa
- Se a resposta não for clara, pede esclarecimentos
- Mantém um tom profissional mas amigável
- Após todas as perguntas, agradece e informa que a pré-entrevista foi concluída

## Estrutura de Dados

### Pergunta de Pré-Entrevista:
```json
{
  "_id": "string",
  "question": "string",
  "category": "personal|experience|education|skills|availability",
  "difficulty": "easy|medium|hard",
  "tag": "string",
  "job_vacancy_id": "string",
  "active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Entrevista:
```json
{
  "_id": "string",
  "candidate_id": "string",
  "job_vacancy_id": "string",
  "status": "in_progress|completed",
  "started_at": "datetime",
  "completed_at": "datetime",
  "responses": {
    "nome": "João Silva",
    "idade": "25",
    "experiencia_anos": "3 anos"
  },
  "questions_asked": ["array of questions"]
}
```

### Contexto do Gemini:
O contexto inclui:
- Prompt base para pré-entrevistas
- Lista de perguntas configuradas com tags
- Instruções de comportamento específicas
- Diretrizes para coleta de dados do currículo
- Mapeamento de perguntas para campos do banco

## Tecnologias Utilizadas

- **Backend**: FastAPI, MongoDB, WebSocket
- **Frontend**: React, Tailwind CSS, Radix UI
- **IA**: Google Gemini API
- **Comunicação**: WebSocket para streaming de áudio

## Próximos Passos

1. Implementar coleta automática de respostas via tool calls
2. Adicionar validação de respostas
3. Implementar relatórios de pré-entrevista
4. Adicionar exportação de dados em diferentes formatos
5. Implementar análise de qualidade das respostas
6. Adicionar configurações de voz personalizadas 