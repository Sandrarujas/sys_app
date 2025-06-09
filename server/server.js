const express = require("express")
const cors = require("cors")
const path = require("path")
const fs = require("fs")
require("dotenv").config()
const errorHandler = require("./middleware/errorHandler")

const app = express()
const PORT = process.env.PORT || 5000

// Crear carpeta de uploads si no existe
const uploadsDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Middleware
app.use(cors())
app.use(express.json())

// Configurar correctamente la ruta de archivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Middleware para depuración de rutas de archivos estáticos
app.use("/uploads", (req, res, next) => {
  console.log("Acceso a archivo estático:", req.url)
  console.log("Ruta completa:", path.join(uploadsDir, req.url))

  // Verificar si el archivo existe
  const filePath = path.join(uploadsDir, req.url)
  if (fs.existsSync(filePath)) {
    console.log("El archivo existe")
  } else {
    console.log("El archivo NO existe")
  }

  next()
})

// Rutas
app.use("/api/auth", require("./routes/auth"))
app.use("/api/users", require("./routes/users"))
app.use("/api/posts", require("./routes/posts"))
app.use("/api/search", require("./routes/search"))
app.use("/api/notifications", require("./routes/notifications"))
app.use("/api/admin", require("./routes/admin"))



// Ruta para verificar archivos
app.get("/check-file", (req, res) => {
  const { path: filePath } = req.query
  if (!filePath) {
    return res.status(400).json({ message: "Se requiere el parámetro 'path'" })
  }

  const fullPath = path.join(__dirname, filePath)
  const exists = fs.existsSync(fullPath)

  res.json({
    path: filePath,
    fullPath,
    exists,
    stats: exists ? fs.statSync(fullPath) : null,
  })
})

// Middleware para manejo de errores
app.use(errorHandler)



// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`)
  console.log(`Carpeta de uploads: ${uploadsDir}`)
})
