# HR Conversational AI

Um sistema de entrevistas prévias automatizadas para o setor de Recursos Humanos, utilizando a IA conversacional do Google Gemini, com backend desenvolvido em FastAPI e frontend em React.

Aplicação: http://hr-conversational-ai-lb-alb-769717365.us-east-1.elb.amazonaws.com/

## Visão Geral

Este projeto permite a realização de pré-entrevistas de emprego de forma automatizada. Perguntas configuráveis são feitas ao candidato por meio de uma interface conversacional, e as respostas são coletadas e armazenadas para análise posterior.

* **Backend:** FastAPI, MongoDB, WebSocket, integração com Google Gemini.
* **Frontend:** React, Tailwind CSS, Radix UI, comunicação via WebSocket para streaming de áudio.

## Funcionalidades Principais

* **Cadastro e Gerenciamento:** Crie e gerencie perguntas de pré-entrevista por vaga.
* **Entrevistas Automatizadas:** Realize entrevistas com coleta de respostas em tempo real.
* **Histórico:** Mantenha um registro das perguntas feitas e das respostas de cada candidato.
* **Interface de Configuração:** Configure perguntas e visualize o andamento das entrevistas.
* **Streaming e IA:** Utilize streaming de áudio e a integração com IA para conduzir a entrevista de forma fluida.

## Estrutura do Projeto
```
hr-conversational-ai/
├── server/     # Backend FastAPI + Gemini + MongoDB
└── web/        # Frontend React + Tailwind + Radix UI
```

## Como Rodar o Projeto

### 1. Backend

**Requisitos:** Python 3.10+, MongoDB

**Instale as dependências:**
```bash
cd server
pip install -r requirements.txt
```

Inicie o servidor:
```Bash
uvicorn server:app --reload
```

### 2. Frontend

**Requisitos**: Node.js 18+

**Instale as dependências**:
```Bash
cd web
npm install
```

**Inicie o frontend**:
```Bash
npm run dev
```

Acesse a aplicação em: http://localhost:5173

## Principais Endpoints

   - `GET /interview_questions` — Lista as perguntas.
   - `POST /interview_questions` — Cria uma nova pergunta.
   - `POST /interviews` — Cria uma nova sessão de entrevista.
   - `PUT /interviews/{id}/responses` — Atualiza as respostas de uma entrevista.
   - Outros endpoints para candidatos, perguntas feitas, etc.

## Tecnologias Utilizadas

**Backend**

  - FastAPI
  - MongoDB
  - websockets
  - aiohttp
  - pydantic
  - Google Gemini API

**Frontend**

  - React 19
  - Tailwind CSS 4
  - Radix UI
  - Vite
  - Axios
  - React Hook Form
  - Zod

## Dependências Principais

Backend (server/requirements.txt)
```
websockets==14.1
certifi==2024.12.14
requests==2.32.3
aiohttp==3.11.11
python-dotenv==1.0.1
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pymongo==4.13.2
```
Frontend (web/package.json)

```JSON
{
  "dependencies": {
    "@google/genai": "...",
    "@radix-ui/react-*": "...",
    "@tailwindcss/vite": "...",
    "tailwindcss": "...",
    "axios": "...",
    "react": "...",
    "react-dom": "...",
    "react-router": "...",
    "react-hook-form": "...",
    "zod": "...",
    "lodash": "...",
    "clsx": "...",
    "three": "..."
  }
}
```

## Estrutura de Dados

Veja o arquivo `INTERVIEW_QUESTIONS_README.md` para detalhes completos sobre os modelos de dados e exemplos de uso.

## Próximos Passos

  [ ] Validação avançada de respostas. <br/>
  [ ] Implementação de relatórios e exportação de dados. <br/>
  [ ] Análise de qualidade e sentimento das respostas. <br/>
  [ ] Implementação de opção para o candidato tirar dúvidas sobre a vaga.
