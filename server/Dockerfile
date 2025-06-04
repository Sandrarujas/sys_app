# Usa una imagen oficial de Node
FROM node:18

# Crea y usa una carpeta de trabajo
WORKDIR /app

# Copia los archivos del backend
COPY package*.json ./
COPY . .

# Instala dependencias
RUN npm install

# Expone el puerto de tu API
EXPOSE 5000

# Comando para arrancar el servidor
CMD ["npm", "start"]
