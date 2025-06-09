const pool = require("../config/db")
const fs = require("fs")
const path = require("path")

// Crear una publicación
const createPost = async (req, res) => {
  const { content } = req.body
  const userId = req.user.id

  let image = null
  try {
    if (req.file) {
      image = req.file.filename
    }

    if (!content && !image) {
      return res.status(400).json({ message: "La publicación debe tener contenido o imagen" })
    }

    const [result] = await pool.query(
      "INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)",
      [userId, content, image]
    )

    res.status(201).json({
      id: result.insertId,
      content,
      image,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Error al crear publicación:", error)
    res.status(500).json({ message: "Error en el servidor: " + error.message })
  }
}

// Obtener todas las publicaciones con paginación
const getPosts = async (req, res) => {
  const userId = req.user.id
  const page = Number.parseInt(req.query.page) || 1
  const limit = Number.parseInt(req.query.limit) || 10
  const offset = (page - 1) * limit

  try {
    const [posts] = await pool.query(
      `SELECT p.id, p.content, p.image, p.created_at as createdAt,
      u.id as userId, u.username, u.profile_image as profileImage
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ? OR p.user_id IN (
        SELECT followed_id FROM followers WHERE follower_id = ?
      )
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, userId, limit, offset],
    )

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total
      FROM posts p
      WHERE p.user_id = ? OR p.user_id IN (
        SELECT followed_id FROM followers WHERE follower_id = ?
      )`,
      [userId, userId],
    )

    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const [likesResult] = await pool.query("SELECT COUNT(*) as count FROM likes WHERE post_id = ?", [post.id])
        const [userLiked] = await pool.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [post.id, userId])
        const [comments] = await pool.query(
          `SELECT c.id, c.content, c.created_at as createdAt,
          u.id as userId, u.username, u.profile_image as profileImage
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.post_id = ?
          ORDER BY c.created_at DESC
          LIMIT 5`,
          [post.id],
        )
        const [commentCount] = await pool.query("SELECT COUNT(*) as count FROM comments WHERE post_id = ?", [post.id])

        const formattedComments = comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: {
            id: comment.userId,
            username: comment.username,
            profileImage: comment.profileImage,
          },
        }))

        return {
          id: post.id,
          content: post.content,
          image: post.image,
          createdAt: post.createdAt,
          likes: likesResult[0].count,
          liked: userLiked.length > 0,
          comments: formattedComments,
          commentCount: commentCount[0].count,
          user: {
            id: post.userId,
            username: post.username,
            profileImage: post.profileImage,
          },
        }
      }),
    )

    res.json({
      posts: postsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Error al obtener publicaciones:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Obtener publicaciones de un usuario específico
const getUserPosts = async (req, res) => {
  const { username } = req.params
  const userId = req.user.id

  try {
    const [users] = await pool.query("SELECT id FROM users WHERE username = ?", [username])

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    const profileUserId = users[0].id

    const [posts] = await pool.query(
      `SELECT p.id, p.content, p.image, p.created_at as createdAt,
      u.id as userId, u.username, u.profile_image as profileImage
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC`,
      [profileUserId],
    )

    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const [likesResult] = await pool.query("SELECT COUNT(*) as count FROM likes WHERE post_id = ?", [post.id])
        const [userLiked] = await pool.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [post.id, userId])
        const [comments] = await pool.query(
          `SELECT c.id, c.content, c.created_at as createdAt,
          u.id as userId, u.username, u.profile_image as profileImage
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.post_id = ?
          ORDER BY c.created_at ASC`,
          [post.id],
        )

        const formattedComments = comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: {
            id: comment.userId,
            username: comment.username,
            profileImage: comment.profileImage,
          },
        }))

        return {
          id: post.id,
          content: post.content,
          image: post.image,
          createdAt: post.createdAt,
          likes: likesResult[0].count,
          liked: userLiked.length > 0,
          comments: formattedComments,
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
    console.error("Error al obtener publicaciones del usuario:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Obtener todos los comentarios de una publicación con paginación
const getPostComments = async (req, res) => {
  const { id } = req.params
  const page = Number.parseInt(req.query.page) || 1
  const limit = Number.parseInt(req.query.limit) || 10
  const offset = (page - 1) * limit

  try {
    const [postExists] = await pool.query("SELECT id FROM posts WHERE id = ?", [id])

    if (postExists.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" })
    }

    const [comments] = await pool.query(
      `SELECT c.id, c.content, c.created_at as createdAt,
      u.id as userId, u.username, u.profile_image as profileImage
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`,
      [id, limit, offset],
    )

    const [countResult] = await pool.query("SELECT COUNT(*) as total FROM comments WHERE post_id = ?", [id])

    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: {
        id: comment.userId,
        username: comment.username,
        profileImage: comment.profileImage,
      },
    }))

    res.json({
      comments: formattedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Error al obtener comentarios:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Dar like a una publicación
const likePost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const [existingLike] = await pool.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [id, userId])

    if (existingLike.length > 0) {
      return res.status(400).json({ message: "Ya has dado like a esta publicación" })
    }

    await pool.query("INSERT INTO likes (post_id, user_id) VALUES (?, ?)", [id, userId])

    res.json({ message: "Like agregado" })
  } catch (error) {
    console.error("Error al dar like:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Quitar like de una publicación
const unlikePost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const [existingLike] = await pool.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [id, userId])

    if (existingLike.length === 0) {
      return res.status(400).json({ message: "No has dado like a esta publicación" })
    }

    await pool.query("DELETE FROM likes WHERE post_id = ? AND user_id = ?", [id, userId])

    res.json({ message: "Like removido" })
  } catch (error) {
    console.error("Error al quitar like:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Comentar en una publicación
const commentPost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  const { content } = req.body

  if (!content || content.trim() === "") {
    return res.status(400).json({ message: "El contenido del comentario no puede estar vacío" })
  }

  try {
    const [postExists] = await pool.query("SELECT id FROM posts WHERE id = ?", [id])
    if (postExists.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" })
    }

    const [result] = await pool.query(
      "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
      [id, userId, content.trim()]
    )

    res.status(201).json({
      id: result.insertId,
      content: content.trim(),
      createdAt: new Date(),
      user: {
        id: userId,
      },
    })
  } catch (error) {
    console.error("Error al crear comentario:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Actualizar una publicación (contenido e imagen)
const updatePost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  const { content } = req.body

  try {
    const [posts] = await pool.query("SELECT * FROM posts WHERE id = ?", [id])
    if (posts.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" })
    }

    const post = posts[0]
    if (post.user_id !== userId) {
      return res.status(403).json({ message: "No tienes permiso para editar esta publicación" })
    }

    let image = post.image

    if (req.file) {
      // Borrar la imagen vieja si existe
      if (image) {
        const oldImagePath = path.join(__dirname, "..", "uploads", image)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }
      image = req.file.filename
    }

    if (!content && !image) {
      return res.status(400).json({ message: "La publicación debe tener contenido o imagen" })
    }

    await pool.query(
      "UPDATE posts SET content = ?, image = ? WHERE id = ?",
      [content, image, id]
    )

    res.json({ message: "Publicación actualizada" })
  } catch (error) {
    console.error("Error al actualizar publicación:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Eliminar una publicación
const deletePost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const [posts] = await pool.query("SELECT * FROM posts WHERE id = ?", [id])
    if (posts.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" })
    }

    const post = posts[0]
    if (post.user_id !== userId) {
      return res.status(403).json({ message: "No tienes permiso para eliminar esta publicación" })
    }

    // Borrar imagen si existe
    if (post.image) {
      const imagePath = path.join(__dirname, "..", "uploads", post.image)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    await pool.query("DELETE FROM posts WHERE id = ?", [id])

    res.json({ message: "Publicación eliminada" })
  } catch (error) {
    console.error("Error al eliminar publicación:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Obtener una publicación por ID
const getPostById = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const [posts] = await pool.query(
      `SELECT p.id, p.content, p.image, p.created_at as createdAt,
      u.id as userId, u.username, u.profile_image as profileImage
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [id],
    )

    if (posts.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" })
    }

    const post = posts[0]

    const [likesResult] = await pool.query("SELECT COUNT(*) as count FROM likes WHERE post_id = ?", [post.id])
    const [userLiked] = await pool.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [post.id, userId])
    const [comments] = await pool.query(
      `SELECT c.id, c.content, c.created_at as createdAt,
      u.id as userId, u.username, u.profile_image as profileImage
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC`,
      [post.id],
    )

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: {
        id: comment.userId,
        username: comment.username,
        profileImage: comment.profileImage,
      },
    }))

    res.json({
      id: post.id,
      content: post.content,
      image: post.image,
      createdAt: post.createdAt,
      likes: likesResult[0].count,
      liked: userLiked.length > 0,
      comments: formattedComments,
      user: {
        id: post.userId,
        username: post.username,
        profileImage: post.profileImage,
      },
    })
  } catch (error) {
    console.error("Error al obtener publicación:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

module.exports = {
  createPost,
  getPosts,
  getUserPosts,
  getPostComments,
  likePost,
  unlikePost,
  commentPost,
  updatePost,
  deletePost,
  getPostById,
}
