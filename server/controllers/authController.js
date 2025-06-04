const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const pool = require("../config/db")

// Registrar un nuevo usuario
const register = async (req, res) => {
  console.log("Datos recibidos en el body:", req.body)
  const { username, email, password, role = "user" } = req.body // ⬅️ Soporte para role

  try {
    // Verificar si el usuario ya existe
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username]
    )

    if (existingUsers.length > 0) {
      return res.status(400).json({
        message: "El email o nombre de usuario ya está en uso",
        conflictingField: existingUsers[0].email === email ? "email" : "username",
      })
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Insertar nuevo usuario con rol
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, role]
    )

    // Generar token
    const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET || "secretkey", {
      expiresIn: "1d",
    })

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        username,
        email,
        role, // ⬅️ Incluimos el role en la respuesta
      },
    })
  } catch (error) {
    console.error("Error detallado en registro:", error)
    res.status(500).json({ message: "Error en el servidor", error: error.message })
  }
}

// Login de usuario
const login = async (req, res) => {
  const { email, password } = req.body

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email])

    if (users.length === 0) {
      return res.status(400).json({ message: "Credenciales inválidas" })
    }

    const user = users[0]

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Credenciales inválidas" })
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secretkey", {
      expiresIn: "1d",
    })

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role, // ⬅️ También enviamos el rol aquí
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Obtener usuario actual
const getCurrentUser = (req, res) => {
  res.json(req.user)
}

module.exports = {
  register,
  login,
  getCurrentUser,
}
