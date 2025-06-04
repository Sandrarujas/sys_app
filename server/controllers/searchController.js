const pool = require("../config/db")

// Buscar usuarios
const searchUsers = async (req, res) => {
  const { q } = req.query

  if (!q || q.trim() === "") {
    return res.status(400).json({ message: "Se requiere un término de búsqueda" })
  }

  try {
    const searchTerm = `%${q}%`

    const [users] = await pool.query(
      `SELECT id, username, profile_image as profileImage, bio
      FROM users
      WHERE username LIKE ? OR bio LIKE ?
      LIMIT 20`,
      [searchTerm, searchTerm],
    )

    // Para cada usuario, verificar si el usuario actual lo sigue
    const usersWithFollowStatus = await Promise.all(
      users.map(async (user) => {
        const [isFollowing] = await pool.query("SELECT * FROM followers WHERE follower_id = ? AND followed_id = ?", [
          req.user.id,
          user.id,
        ])

        return {
          ...user,
          isFollowing: isFollowing.length > 0,
        }
      }),
    )

    res.json(usersWithFollowStatus)
  } catch (error) {
    console.error("Error al buscar usuarios:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Buscar publicaciones
const searchPosts = async (req, res) => {
  const { q } = req.query

  if (!q || q.trim() === "") {
    return res.status(400).json({ message: "Se requiere un término de búsqueda" })
  }

  try {
    const searchTerm = `%${q}%`

    const [posts] = await pool.query(
      `SELECT p.id, p.content, p.image, p.created_at as createdAt,
      u.id as userId, u.username, u.profile_image as profileImage
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.content LIKE ?
      ORDER BY p.created_at DESC
      LIMIT 20`,
      [searchTerm],
    )

    // Para cada publicación, obtener likes y comentarios
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        // Contar likes
        const [likesResult] = await pool.query("SELECT COUNT(*) as count FROM likes WHERE post_id = ?", [post.id])

        // Verificar si el usuario actual dio like
        const [userLiked] = await pool.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [
          post.id,
          req.user.id,
        ])

        return {
          id: post.id,
          content: post.content,
          image: post.image,
          createdAt: post.createdAt,
          likes: likesResult[0].count,
          liked: userLiked.length > 0,
          user: {
            id: post.userId,
            username: post.username,
            profileImage: post.profileImage,
          },
        }
      }),
    )

    res.json(postsWithDetails)
  } catch (error) {
    console.error("Error al buscar publicaciones:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

module.exports = {
  searchUsers,
  searchPosts,
}
