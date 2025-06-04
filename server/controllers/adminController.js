// controllers/adminController.js
const pool = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    const [
      [totalUsers],
      [newUsers],
      [totalPosts],
      [newPosts],
      [totalComments]
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total_users FROM users"),
      pool.query("SELECT COUNT(*) AS new_users_month FROM users WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())"),
      pool.query("SELECT COUNT(*) AS total_posts FROM posts"),
      pool.query("SELECT COUNT(*) AS new_posts_month FROM posts WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())"),
      pool.query("SELECT COUNT(*) AS total_comments FROM comments")
    ]);

    const users = {
      total_users: totalUsers[0].total_users,
      new_users_month: newUsers[0].new_users_month
    };

    const posts = {
      total_posts: totalPosts[0].total_posts,
      new_posts_month: newPosts[0].new_posts_month
    };

    const comments = {
      total_comments: totalComments[0].total_comments
    };

    res.json({ users, posts, comments });
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({ message: "Error al obtener estadísticas del dashboard" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, username, email, created_at, role FROM users");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

const deleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [userId]);
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM posts ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener posts:", error);
    res.status(500).json({ message: "Error al obtener publicaciones" });
  }
};

const deletePost = async (req, res) => {
  const { postId } = req.params;
  try {
    await pool.query("DELETE FROM posts WHERE id = ?", [postId]);
    res.json({ message: "Publicación eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar post:", error);
    res.status(500).json({ message: "Error al eliminar publicación" });
  }
};

const getAllComments = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM comments ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener comentarios:", error);
    res.status(500).json({ message: "Error al obtener comentarios" });
  }
};

const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  try {
    await pool.query("DELETE FROM comments WHERE id = ?", [commentId]);
    res.json({ message: "Comentario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar comentario:", error);
    res.status(500).json({ message: "Error al eliminar comentario" });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  getAllPosts,
  deletePost,
  getAllComments,
  deleteComment
};
