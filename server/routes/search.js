const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")
const { searchUsers, searchPosts } = require("../controllers/searchController")

// Buscar usuarios
router.get("/users", authenticateToken, searchUsers)

// Buscar publicaciones
router.get("/posts", authenticateToken, searchPosts)

module.exports = router
