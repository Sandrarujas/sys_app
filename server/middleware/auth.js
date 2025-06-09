const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; // Más limpio

  if (!token) {
    return res.status(401).json({ message: "Acceso denegado: token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    const [rows] = await pool.query(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    console.error("Error al verificar token:", error.message);
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
};

module.exports = { authenticateToken };
