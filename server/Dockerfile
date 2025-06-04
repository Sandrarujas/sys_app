# Usa una imagen oficial de Node.js
FROM node:18

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos del backend
COPY package*.json ./
COPY . .

# Instala las dependencias del backend
RUN npm install

# Expone el puerto que usa tu servidor (ajusta si usas otro)
EXPOSE 5000

# Comando para arrancar el backend
CMD ["npm", "start"]
