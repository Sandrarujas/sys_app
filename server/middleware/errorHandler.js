// Middleware para manejar errores generales
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err)

  // Si ya se ha enviado una respuesta, pasar al siguiente middleware
  if (res.headersSent) {
    return next(err)
  }

  // Determinar el código de estado
  const statusCode = err.statusCode || 500

  // Enviar respuesta de error
  res.status(statusCode).json({
    message: err.message || "Error interno del servidor",
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  })
}

module.exports = errorHandler
