# 1. Base image
FROM node:20

# 2. Directorio de trabajo
WORKDIR /app

# 3. Copia solo package.json y package-lock.json
COPY package.json package-lock.json ./

# 4. Copia la carpeta de prisma para que prisma migrate funcione
COPY prisma ./prisma/

# 5. Instala dependencias EXACTAS (requiere package-lock.json)
RUN npm ci

# 6. Copia el resto del código
COPY . .

# 7. Aplica migraciones y genera el cliente de Prisma
RUN npx prisma migrate deploy
RUN npx prisma generate

# 8. Expone el puerto que usas en tu app
EXPOSE 4000

# 9. Arranca la aplicación
CMD ["npm", "start"]
