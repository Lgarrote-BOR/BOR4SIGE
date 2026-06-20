FROM node:18-alpine

WORKDIR /app

# Instalar dependencias primero
COPY package*.json ./
RUN npm ci --only=production

# Copiar el código fuente de la aplicación
COPY . .

# Usar el puerto 8080 por defecto en Cloud Run
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
