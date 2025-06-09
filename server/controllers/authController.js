const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const pool = require("../config/db")

// Registrar un nuevo usuario
const register = async (req, res) => {
  console.log("Datos recibidos en el body (register):", req.body)
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    console.log("Faltan campos obligatorios en registro")
    return res.status(400).json({ message: "Faltan campos obligatorios" })
  }

  try {
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username]
    )
    console.log("Usuarios existentes encontrados:", existingUsers)

    if (existingUsers.length > 0) {
      return res.status(400).json({
        message: "El email o nombre de usuario ya está en uso",
        conflictingField: existingUsers[0].email === email ? "email" : "username",
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    console.log("Contraseña hasheada generada")

    // Forzar el role a 'user' para evitar manipulación en frontend
    const role = "user"

    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, role]
    )
    console.log("Usuario insertado con ID:", result.insertId)

    const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET || "secretkey", {
      expiresIn: "1d",
    })

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        username,
        email,
        role,
      },
    })
  } catch (error) {
    console.error("Error detallado en registro:", error)
    res.status(500).json({ message: "Error en el servidor", error: error.message })
  }
}

// Login de usuario
const login = async (req, res) => {
  console.log("Datos recibidos en el body (login):", req.body)
  const { email, password } = req.body

  if (!email || !password) {
    console.log("Faltan campos obligatorios en login")
    return res.status(400).json({ message: "Faltan campos obligatorios" })
  }

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email])
    console.log("Usuarios encontrados para login:", users)

    if (users.length === 0) {
      console.log("No existe usuario con ese email")
      return res.status(400).json({ message: "Credenciales inválidas" })
    }

    const user = users[0]

    const isMatch = await bcrypt.compare(password, user.password)
    console.log("Resultado comparación contraseña:", isMatch)
    if (!isMatch) {
      console.log("Contraseña incorrecta")
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
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    res.status(500).json({ message: "Error en el servidor", error: error.message })
  }
}

// Obtener usuario actual
const getCurrentUser = (req, res) => {
  console.log("Usuario actual solicitado:", req.user)
  res.json(req.user)
}

module.exports = {
  register,
  login,
  getCurrentUser,
}
