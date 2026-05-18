FROM node:20-alpine AS build

WORKDIR /app
LABEL coursework.app="a5-react"
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine

LABEL coursework.app="a5-react"
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
