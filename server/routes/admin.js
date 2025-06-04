const express = require("express")
const router = express.Router()

const adminController = require("../controllers/adminController")
const { authenticateToken } = require("../middleware/auth")
const { adminAuth, superAdminAuth } = require("../middleware/admin")

// Middleware para autenticación y roles admin/moderator
router.use(authenticateToken)
router.use(adminAuth)

// Dashboard
router.get("/dashboard/stats", adminController.getDashboardStats)

// Usuarios
router.get("/users", adminController.getAllUsers)
router.delete("/users/:userId", superAdminAuth, adminController.deleteUser)

// Posts
router.get("/posts", adminController.getAllPosts)
router.delete("/posts/:postId", adminController.deletePost)

// Comentarios
router.get("/comments", adminController.getAllComments)
router.delete("/comments/:commentId", adminController.deleteComment)

module.exports = router
