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
CMD ["npm", "start"]

# Etapa de produção (transpilação e otimização)
FROM base AS production
WORKDIR /usr/src/app
COPY . .
# Transpila o código com Babel para a versão de produção
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
