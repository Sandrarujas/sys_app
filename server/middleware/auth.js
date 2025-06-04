const jwt = require("jsonwebtoken")
const pool = require("../config/db")

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Acceso denegado" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey")

    // Obtener información del usuario desde la base de datos
    const [rows] = await pool.query("SELECT id, username, email, role FROM users WHERE id = ?", [decoded.id])

    if (rows.length === 0) {
      return res.status(401).json({ message: "Usuario no encontrado" })
    }

    req.user = rows[0]
    next()
  } catch (error) {
    return res.status(403).json({ message: "Token inválido" })
  }
}

module.exports = { authenticateToken }
