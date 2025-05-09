FROM node:20
WORKDIR /app

# Copiar prisma y manifiestos
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Ahora npm ci ejecutará postinstall (migrate)
RUN npm ci

# Copiar el resto
COPY . .

# Generar cliente (si no lo hace postinstall)
RUN npx prisma generate

EXPOSE 4000
CMD ["npm", "start"]
