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

// Configuración de CORS mejorada para producción
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        /\.railway\.app$/,  // Permite cualquier subdominio de railway.app
        /\.vercel\.app$/    // Por si usas Vercel para el frontend
      ]
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000"
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Configurar correctamente la ruta de archivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0, // Cache en producción
  etag: true
}))

// Middleware para depuración de rutas de archivos estáticos (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
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
}

// Middleware de logging para producción
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
    next()
  })
}

// Rutas API
app.use("/api/auth", require("./routes/auth"))
app.use("/api/users", require("./routes/users"))
app.use("/api/posts", require("./routes/posts"))
app.use("/api/search", require("./routes/search"))
app.use("/api/notifications", require("./routes/notifications"))
app.use("/api/admin", require("./routes/admin"))

// Ruta de salud para Railway y monitoreo
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// Ruta para verificar archivos (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
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
}

// IMPORTANTE: Servir el frontend en producción
if (process.env.NODE_ENV === "production") {
  // Servir archivos estáticos del build de React
  const buildPath = path.join(__dirname, "../client/build")
  
  // Verificar que existe la carpeta build
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath, {
      maxAge: '1d', // Cache de 1 día para archivos estáticos
      etag: true
    }))

    // Para cualquier ruta que no sea API, servir index.html (SPA routing)
    app.get("*", (req, res) => {
      // No servir index.html para rutas de API
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        return res.status(404).json({ message: 'Ruta no encontrada' })
      }
      
      res.sendFile(path.join(buildPath, "index.html"))
    })
  } else {
    console.warn("⚠️  Carpeta build no encontrada. Asegúrate de ejecutar 'npm run build' en el cliente.")
  }
}

// Middleware para manejo de errores (debe ir al final)
app.use(errorHandler)

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  })
})

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`)
  console.log(`📁 Carpeta de uploads: ${uploadsDir}`)
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`)
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🔗 Aplicación disponible en: https://tu-app.railway.app`)
  } else {
    console.log(`🔗 API disponible en: http://localhost:${PORT}`)
    console.log(`🔗 Frontend disponible en: http://localhost:3000`)
  }
})