# Etapa de base (instalação de dependências)
FROM node:18-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

# Etapa de desenvolvimento
FROM base AS development
WORKDIR /usr/src/app
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Etapa de produção (transpilação e otimização)
FROM base AS production
WORKDIR /usr/src/app
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/api.js"]
