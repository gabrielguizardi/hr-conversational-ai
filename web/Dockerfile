FROM node:20 AS build
WORKDIR /app
COPY ./web .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html