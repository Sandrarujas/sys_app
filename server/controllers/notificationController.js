const pool = require("../config/db"); // Conexión a la base de datos

const getNotifications = async (req, res) => {
  const userId = req.user.id;
  const page = Number.parseInt(req.query.page) || 1;
  const limit = Number.parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Obtener notificaciones con info adicional
    const [notifications] = await pool.query(
      `SELECT n.id, n.type, n.is_read AS isRead, n.created_at AS createdAt,
              n.post_id AS postId, n.comment_id AS commentId,
              u.id AS senderId, u.username AS senderUsername, u.profile_image AS senderProfileImage,
              p.content AS postContent,
              c.content AS commentContent
       FROM notifications n
       JOIN users u ON n.sender_id = u.id
       LEFT JOIN posts p ON n.post_id = p.id
       LEFT JOIN comments c ON n.comment_id = c.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // Total de notificaciones
    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM notifications WHERE user_id = ?",
      [userId]
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // No leídas
    const [unreadResult] = await pool.query(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
      [userId]
    );

    res.json({
      notifications,
      unreadCount: unreadResult[0].count,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const getUnreadCount = async (req, res) => {
  const userId = req.user.id;

  try {
    const [result] = await pool.query(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
      [userId]
    );
    res.json({ unreadCount: result[0].count });
  } catch (error) {
    console.error("Error al contar notificaciones no leídas:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const markAsRead = async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;

  try {
    await pool.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [notificationId, userId]
    );
    res.json({ message: "Notificación marcada como leída" });
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const markAllAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.query(
      "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
      [userId]
    );
    res.json({ message: "Todas las notificaciones marcadas como leídas" });
  } catch (error) {
    console.error("Error al marcar todas como leídas:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// NUEVO: Obtener comentario de una notificación concreta
const getCommentByNotification = async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;

  try {
    const [result] = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.id AS commenterId, u.username AS commenterUsername, u.profile_image AS commenterProfileImage
       FROM notifications n
       JOIN comments c ON n.comment_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE n.id = ? AND n.user_id = ?`,
      [notificationId, userId]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Comentario no encontrado" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error al obtener comentario:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getCommentByNotification,
};
