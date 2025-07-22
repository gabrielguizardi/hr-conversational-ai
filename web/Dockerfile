# Etapa de build
FROM node:20 AS builder
WORKDIR /app
COPY ./web ./
RUN npm ci && npm run build

ENV NODE_ENV
ENV VITE_API_URL
ENV VITE_WS_URL
ENV VITE_PROJECT_URL

# Etapa final: servidor Nginx
FROM nginx:alpine

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia o build da aplicação
COPY --from=builder /app/dist /usr/share/nginx/html

# Adiciona nova configuração do Nginx
COPY ./web/nginx.conf /etc/nginx/conf.d/default.conf

# Exponha a porta 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]