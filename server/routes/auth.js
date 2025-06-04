const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")
const { registerValidators, loginValidators } = require("../middleware/validators")
const { register, login, getCurrentUser } = require("../controllers/authController")

// Ruta de registro
router.post("/register", registerValidators, register)

// Ruta de login
router.post("/login", loginValidators, login)

// Ruta para obtener usuario actual
router.get("/me", authenticateToken, getCurrentUser)

module.exports = router
