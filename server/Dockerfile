FROM python:3.11-slim

WORKDIR /app

# Copia e instala as dependências
COPY ./server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante dos arquivos da aplicação
COPY ./server .

# Expõe a porta padrão do uvicorn
EXPOSE 8000

# Comando para iniciar a aplicação com uvicorn
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]