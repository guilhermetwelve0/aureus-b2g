FROM node:20-alpine

WORKDIR /app

# Instala apenas dependencias de producao
COPY package*.json ./
RUN npm install --production --no-audit --no-fund

# Copia codigo da aplicacao
COPY . .

# Variaveis de ambiente padrao
ENV PORT=10000 \
    NODE_ENV=production

EXPOSE 10000

# Healthcheck interno
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:10000/up || exit 1

CMD ["node", "server.js"]
