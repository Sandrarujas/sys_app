FROM node:18

WORKDIR /app

# Copiamos solo package.json y package-lock.json para instalar dependencias primero (capa cacheable)
COPY package*.json ./

RUN npm install

# Copiamos solo el backend (ignorar client gracias al .dockerignore)
COPY . .

EXPOSE 5000

CMD ["npm", "start"]
