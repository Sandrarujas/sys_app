const express = require("express")
const router = express.Router()

const adminController = require("../controllers/adminController")
const { authenticateToken } = require("../middleware/auth")
const { adminAuth, superAdminAuth } = require("../middleware/admin")

// Aplica solo la autenticación para todas las rutas
router.use(authenticateToken)

// Para las rutas que requieren admin o moderator, usar adminAuth explícitamente en cada ruta
router.get("/dashboard/stats", adminAuth, adminController.getDashboardStats)

router.get("/users", adminAuth, adminController.getAllUsers)
// Para eliminar usuario, se requiere superAdminAuth (admin exclusivo)
router.delete("/users/:userId", superAdminAuth, adminController.deleteUser)

router.get("/posts", adminAuth, adminController.getAllPosts)
router.delete("/posts/:postId", adminAuth, adminController.deletePost)

router.get("/comments", adminAuth, adminController.getAllComments)
router.delete("/comments/:commentId", adminAuth, adminController.deleteComment)

module.exports = router
