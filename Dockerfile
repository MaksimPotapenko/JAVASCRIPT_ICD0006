FROM node:20-alpine AS a2-build

WORKDIR /app/A2
COPY A2/package*.json ./
RUN npm ci
COPY A2 ./
RUN npm run build

FROM nginx:alpine

COPY A1 /usr/share/nginx/html/a1
COPY --from=a2-build /app/A2 /usr/share/nginx/html/a2
COPY deploy/index.html /usr/share/nginx/html/index.html
COPY deploy/nginx.conf /etc/nginx/nginx.conf
