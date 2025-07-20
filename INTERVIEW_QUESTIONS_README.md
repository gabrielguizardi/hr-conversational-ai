## Funcionalidades Implementadas


### Backend (Server)


- **Gerenciamento de perguntas de pré-entrevista:**

  - `GET /interview_questions` — Lista todas as perguntas

  - `POST /interview_questions` — Cria uma nova pergunta

  - `PUT /interview_questions/{question_id}` — Atualiza uma pergunta

  - `DELETE /interview_questions/{question_id}` — Remove uma pergunta

  - `GET /interview_questions/job_vacancy/{job_vacancy_id}` — Lista perguntas de uma vaga específica

- **Entrevistas:**

  - `POST /interviews` — Cria uma nova sessão de entrevista

  - `PUT /interviews/{interview_id}/responses` — Atualiza respostas da entrevista

  - `GET /interviews/{interview_id}` — Busca entrevista por ID

  - `GET /interviews/candidate/{candidate_id}` — Lista entrevistas de um candidato

- **Perguntas feitas:**

  - `GET /interview_questions_asked` — Lista todas as perguntas feitas

  - `GET /interview_questions_asked/interview/{interview_id}` — Lista perguntas de uma entrevista específica

  - `GET /interview_questions_asked/candidate/{candidate_id}` — Lista perguntas de um candidato específico

- **Candidato:**

  - `GET /candidates/{candidate_id}` — Busca candidato por ID

- **Proxy:**

  - Busca perguntas de pré-entrevista baseadas no `job_vacancy_id`

  - Inclui perguntas e tags no contexto enviado para o Gemini

  - Usa prompt específico para pré-entrevistas quando há perguntas configuradas

  - Mapeia perguntas para tags para facilitar a coleta de respostas


### Frontend (Web)


- **Componentes:**

  - `InterviewQuestionsDialog` — Interface para gerenciar perguntas

  - `InterviewProvider` — Provider que inclui jobVacancyId no contexto

- **Serviços:**

  - `interview-questions.js` — API para gerenciar perguntas

  - `interviews.js` — API para gerenciar entrevistas e respostas

  - `interview-questions-asked.js` — API para acessar perguntas feitas

  - `candidates.js` — Adicionado método `show`

- **Páginas:**

  - `job-vacancy-show.jsx` — Botão para gerenciar perguntas

  - `meet.jsx` — Usa InterviewProvider com jobVacancyId e mostra perguntas feitas

  - `interview-questions-asked.jsx` — Página para visualizar histórico de perguntas feitas


## Como Usar


### 1. Configurar Perguntas para uma Vaga


1. Acesse a página de visualização da vaga

2. Clique no botão **Gerenciar Perguntas**

3. Adicione perguntas com os seguintes campos:

   - **Pergunta:** Texto da pergunta (ex: "Qual seu nome completo?")

   - **Categoria:** Dados Pessoais, Experiência Profissional, Formação Acadêmica, Habilidades, Disponibilidade

   - **Dificuldade:** Fácil, Médio, Difícil

   - **Tag:** Nome do campo no banco (ex: "nome", "idade", "experiencia_anos")

   - **Status:** Ativa/Inativa


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


### Pergunta de Pré-Entrevista

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


### Entrevista

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


### Pergunta Feita

```json

{

  "_id": "string",

  "interview_id": "string",

  "candidate_id": "string",

  "job_vacancy_id": "string",

  "question_text": "string",

  "question_number": "number",

  "asked_at": "datetime",

  "status": "asked|answered|skipped"

}

```


### Contexto do Gemini

O contexto inclui:

- Prompt base para pré-entrevistas

- Lista de perguntas configuradas com tags

- Instruções de comportamento específicas

- Diretrizes para coleta de dados do currículo

- Mapeamento de perguntas para campos do banco


## Tecnologias Utilizadas


- **Backend:** FastAPI, MongoDB, WebSocket

- **Frontend:** React, Tailwind CSS, Radix UI

- **IA:** Google Gemini API

- **Comunicação:** WebSocket para streaming de áudio
