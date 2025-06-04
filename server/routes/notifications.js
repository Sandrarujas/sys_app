const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")
const { getNotifications, markAsRead, markAllAsRead, getUnreadCount } = require("../controllers/notificationController")

// Obtener notificaciones
router.get("/", authenticateToken, getNotifications)

// Marcar notificación como leída
router.put("/:id/read", authenticateToken, markAsRead)

// Marcar todas las notificaciones como leídas
router.put("/read-all", authenticateToken, markAllAsRead)

// Obtener conteo de notificaciones no leídas
router.get("/unread-count", authenticateToken, getUnreadCount)

module.exports = router
