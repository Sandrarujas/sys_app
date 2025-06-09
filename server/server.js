const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require('dotenv').config();
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Crear carpeta de uploads si no existe (para archivos locales)
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Importar la ruta de upload (que sube a Cloudinary)
const uploadRoutes = require('./routes/upload');

// Configuración de CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        process.env.FRONTEND_URL,
        /\.railway\.app$/,
        /\.vercel\.app$/
      ]
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000"
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Archivos estáticos: /uploads (para archivos locales)
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true
}));

// Logging de archivos estáticos (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadsDir, req.url);
    console.log("Archivo solicitado:", filePath);
    next();
  });
}

// Logging de peticiones (solo en producción)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Rutas de la API
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/search", require("./routes/search"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/admin", require("./routes/admin"));

// Añadir la ruta de subida de imágenes a Cloudinary
app.use("/api", uploadRoutes);

// Ruta de salud
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Ruta para desarrollo: mensaje en "/"
if (process.env.NODE_ENV !== 'production') {
  app.get("/", (req, res) => {
    res.json({ message: "API funcionando correctamente" });
  });
}

// Ruta para verificar archivos en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.get("/check-file", (req, res) => {
    const { path: filePath } = req.query;
    if (!filePath) {
      return res.status(400).json({ message: "Se requiere el parámetro 'path'" });
    }

    const fullPath = path.join(__dirname, filePath);
    const exists = fs.existsSync(fullPath);

    res.json({
      path: filePath,
      fullPath,
      exists,
      stats: exists ? fs.statSync(fullPath) : null
    });
  });
}

// SERVIR FRONTEND EN PRODUCCIÓN
if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../client/build");

  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath, {
      maxAge: '1d',
      etag: true
    }));

    // Redirigir rutas no-API al frontend (React Router)
    app.get("*", (req, res) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        return res.status(404).json({ message: 'Ruta no encontrada' });
      }

      res.sendFile(path.join(buildPath, "index.html"));
    });
  } else {
    console.warn("⚠️  No se encontró la carpeta build de React. Asegúrate de haber corrido 'npm run build' en el cliente.");
  }
}

// Middleware de errores
app.use(errorHandler);

// Ruta no encontrada (catch-all)
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Manejadores de errores globales
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  console.log(`📁 Carpeta de uploads: ${uploadsDir}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);

  if (process.env.NODE_ENV === 'production') {
    console.log(`🔗 Aplicación disponible en Railway`);
  } else {
    console.log(`🔗 API disponible en http://localhost:${PORT}`);
    console.log(`🔗 Frontend en http://localhost:3000`);
  }
});
