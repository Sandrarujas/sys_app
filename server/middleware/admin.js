const adminAuth = (req, res, next) => {
  // Verificar que el usuario esté autenticado
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" })
  }

  // Verificar que el usuario tenga rol de admin o moderator
  if (req.user.role !== "admin" && req.user.role !== "moderator") {
    return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de administrador." })
  }

  next()
}

const superAdminAuth = (req, res, next) => {
  // Verificar que el usuario esté autenticado
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" })
  }

  // Verificar que el usuario tenga rol de admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de super administrador." })
  }

  next()
}

module.exports = { adminAuth, superAdminAuth }
