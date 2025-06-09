const pool = require("../config/db")
const cloudinary = require("../config/cloudinary")
const fs = require("fs").promises

// Crear una publicación
const createPost = async (req, res) => {
  const { content } = req.body
  const userId = req.user.id

  if (content && typeof content !== "string") {
    return res.status(400).json({ message: "Contenido inválido" })
  }

  let image = null
  try {
    if (req.file) {
      // Subir desde buffer
      const uploadFromBuffer = (buffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "Carpeta de fotos" },
            (error, result) => {
              if (error) return reject(error)
              resolve(result)
            }
          )
          stream.end(buffer)
        })

      const result = await uploadFromBuffer(req.file.buffer)
      image = result.secure_url
    }

    if ((!content || content.trim() === "") && !image) {
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
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

// Obtener todas las publicaciones con paginación (optimizado)
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
      [userId, userId, limit, offset]
    )

    if (posts.length === 0) {
      return res.json({
        posts: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      })
    }

    const postIds = posts.map((p) => p.id)

    const [likesResults] = await pool.query(
      `SELECT post_id, COUNT(*) as count
       FROM likes
       WHERE post_id IN (?)
       GROUP BY post_id`,
      [postIds]
    )

    const [userLikes] = await pool.query(
      `SELECT post_id FROM likes WHERE post_id IN (?) AND user_id = ?`,
      [postIds, userId]
    )
    const userLikesSet = new Set(userLikes.map((like) => like.post_id))

    const [commentsRows] = await pool.query(
      `SELECT c.id, c.content, c.created_at as createdAt,
              c.post_id,
              u.id as userId, u.username, u.profile_image as profileImage
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id IN (?)
       ORDER BY c.created_at DESC`,
      [postIds]
    )

    const commentsByPost = {}
    for (const comment of commentsRows) {
      if (!commentsByPost[comment.post_id]) {
        commentsByPost[comment.post_id] = []
      }
      if (commentsByPost[comment.post_id].length < 5) {
        commentsByPost[comment.post_id].push({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: {
            id: comment.userId,
            username: comment.username,
            profileImage: comment.profileImage,
          },
        })
      }
    }

    const [commentCounts] = await pool.query(
      `SELECT post_id, COUNT(*) as count
       FROM comments
       WHERE post_id IN (?)
       GROUP BY post_id`,
      [postIds]
    )
    const commentCountMap = {}
    for (const c of commentCounts) {
      commentCountMap[c.post_id] = c.count
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total
      FROM posts p
      WHERE p.user_id = ? OR p.user_id IN (
        SELECT followed_id FROM followers WHERE follower_id = ?
      )`,
      [userId, userId]
    )

    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    const postsWithDetails = posts.map((post) => ({
      id: post.id,
      content: post.content,
      image: post.image,
      createdAt: post.createdAt,
      likes: (likesResults.find((like) => like.post_id === post.id)?.count) || 0,
      liked: userLikesSet.has(post.id),
      comments: commentsByPost[post.id] || [],
      commentCount: commentCountMap[post.id] || 0,
      user: {
        id: post.userId,
        username: post.username,
        profileImage: post.profileImage,
      },
    }))

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
    res.status(500).json({ message: "Error interno del servidor" })
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
      [profileUserId]
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
          [post.id]
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
      })
    )

    res.json(postsWithDetails)
  } catch (error) {
    console.error("Error al obtener publicaciones del usuario:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

// Actualizar publicación (modificado para subir imagen a Cloudinary)
const updatePost = async (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const userId = req.user.id

  if (content && typeof content !== "string") {
    return res.status(400).json({ message: "Contenido inválido" })
  }

  try {
    const [posts] = await pool.query("SELECT * FROM posts WHERE id = ? AND user_id = ?", [id, userId])

    if (posts.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada o no tienes permiso" })
    }

    if ((!content || content.trim() === "") && !req.file) {
      return res.status(400).json({ message: "El contenido no puede estar vacío o debe incluir una imagen" })
    }

    let image = posts[0].image

    if (req.file) {
      // Subir nueva imagen a Cloudinary desde buffer
      const uploadFromBuffer = (buffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "Carpeta de fotos" },
            (error, result) => {
              if (error) return reject(error)
              resolve(result)
            }
          )
          stream.end(buffer)
        })

      const result = await uploadFromBuffer(req.file.buffer)

      // Eliminar imagen anterior si existía
      if (image) {
        try {
          const segments = image.split("/")
          const filename = segments[segments.length - 1]
          const publicId = filename.split(".")[0]
          await cloudinary.uploader.destroy(publicId)
        } catch (err) {
          console.error("Error borrando imagen anterior de Cloudinary:", err)
        }
      }

      image = result.secure_url
    }

    await pool.query("UPDATE posts SET content = ?, image = ? WHERE id = ?", [content, image, id])

    res.json({ message: "Publicación actualizada", content, image })
  } catch (error) {
    console.error("Error al actualizar publicación:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

// Eliminar publicación con transacción y borrado seguro
const deletePost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [posts] = await conn.query("SELECT * FROM posts WHERE id = ? AND user_id = ?", [id, userId])
    if (posts.length === 0) {
      await conn.rollback()
      return res.status(404).json({ message: "Publicación no encontrada o no tienes permiso" })
    }
    const image = posts[0].image

    await conn.query("DELETE FROM comments WHERE post_id = ?", [id])
    await conn.query("DELETE FROM likes WHERE post_id = ?", [id])
    await conn.query("DELETE FROM posts WHERE id = ?", [id])

    if (image) {
      try {
        const segments = image.split("/")
        const filename = segments[segments.length - 1]
        const publicId = filename.split(".")[0]
        await cloudinary.uploader.destroy(publicId)
      } catch (err) {
        console.error("Error borrando imagen de Cloudinary:", err)
      }
    }

    await conn.commit()
    res.json({ message: "Publicación eliminada" })
  } catch (error) {
    await conn.rollback()
    console.error("Error al eliminar publicación:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  } finally {
    conn.release()
  }
}

module.exports = {
  createPost,
  getPosts,
  getUserPosts,
  updatePost,
  deletePost,
}
