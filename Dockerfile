FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:server
EXPOSE 8443
CMD node dist/server/index.js
