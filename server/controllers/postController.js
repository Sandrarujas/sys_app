const pool = require("../config/db")
const cloudinary = require("../config/cloudinary")
const fs = require("fs").promises
const path = require("path")

// Crear una publicación
const createPost = async (req, res) => {
  const { content } = req.body
  const userId = req.user.id

  // Validar contenido (si viene)
  if (content && typeof content !== "string") {
    return res.status(400).json({ message: "Contenido inválido" })
  }

  let image = null
  try {
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "Carpeta de fotos",
      })

      // Borrar archivo local temporal con promesas
      await fs.unlink(req.file.path).catch((err) =>
        console.error("Error borrando archivo local:", err)
      )

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
    // Obtener posts
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

    // Obtener ids de posts para batch queries
    const postIds = posts.map((p) => p.id)

    // Obtener likes totales por post
    const [likesResults] = await pool.query(
      `SELECT post_id, COUNT(*) as count
       FROM likes
       WHERE post_id IN (?)
       GROUP BY post_id`,
      [postIds]
    )

    // Obtener los posts que el usuario actual ha liked (solo sus ids)
    const [userLikes] = await pool.query(
      `SELECT post_id FROM likes WHERE post_id IN (?) AND user_id = ?`,
      [postIds, userId]
    )
    const userLikesSet = new Set(userLikes.map((like) => like.post_id))

    // Obtener 5 comentarios recientes por post (batch)
    // Esta consulta usa GROUP_CONCAT para juntar comentarios por post y luego parseamos en JS
    // Pero MySQL no tiene funciones JSON tan fáciles, así que hacemos consulta normal y luego agrupamos

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

    // Agrupar comentarios por post y tomar solo los primeros 5 (más recientes)
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

    // Obtener conteo de comentarios por post
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

    // Obtener total para paginación
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

// Obtener publicaciones de un usuario específico (sin cambios, pero mejor validación de contenido en comentarios)
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

// Editar una publicación
const updatePost = async (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const userId = req.user.id

  // Validar contenido
  if (content && typeof content !== "string") {
    return res.status(400).json({ message: "Contenido inválido" })
  }

  try {
    // Verificar que la publicación existe y pertenece al usuario
    const [posts] = await pool.query("SELECT * FROM posts WHERE id = ? AND user_id = ?", [id, userId])

    if (posts.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada o no tienes permiso" })
    }

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "El contenido no puede estar vacío" })
    }

    await pool.query("UPDATE posts SET content = ? WHERE id = ?", [content, id])

    res.json({ message: "Publicación actualizada" })
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

    // Verificar que la publicación existe y pertenece al usuario
    const [posts] = await conn.query("SELECT * FROM posts WHERE id = ? AND user_id = ?", [id, userId])
    if (posts.length === 0) {
      await conn.rollback()
      return res.status(404).json({ message: "Publicación no encontrada o no tienes permiso" })
    }

    // Si tiene imagen, borrarla en Cloudinary
    if (posts[0].image) {
      const publicId = posts[0].image.split("/").pop().split(".")[0]
      await cloudinary.uploader.destroy(publicId).catch((err) => {
        console.error("Error borrando imagen de Cloudinary:", err)
      })
    }

    await conn.query("DELETE FROM posts WHERE id = ?", [id])

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

// Agregar like a una publicación
const likePost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    // Verificar si ya le dio like
    const [likes] = await pool.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [id, userId])
    if (likes.length > 0) {
      return res.status(400).json({ message: "Ya le diste like a esta publicación" })
    }

    await pool.query("INSERT INTO likes (post_id, user_id) VALUES (?, ?)", [id, userId])
    res.json({ message: "Like agregado" })
  } catch (error) {
    console.error("Error al dar like:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

// Quitar like de una publicación
const unlikePost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    // Verificar si tiene like
    const [likes] = await pool.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [id, userId])
    if (likes.length === 0) {
      return res.status(400).json({ message: "No le has dado like a esta publicación" })
    }

    await pool.query("DELETE FROM likes WHERE post_id = ? AND user_id = ?", [id, userId])
    res.json({ message: "Like removido" })
  } catch (error) {
    console.error("Error al quitar like:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

// Agregar comentario a una publicación
const addComment = async (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const userId = req.user.id

  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({ message: "El contenido del comentario es obligatorio" })
  }

  try {
    await pool.query("INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)", [id, userId, content])
    res.status(201).json({ message: "Comentario agregado" })
  } catch (error) {
    console.error("Error al agregar comentario:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

// Obtener comentarios de una publicación con paginación
const getPostComments = async (req, res) => {
  const { id } = req.params
  const page = Number.parseInt(req.query.page) || 1
  const limit = Number.parseInt(req.query.limit) || 10
  const offset = (page - 1) * limit

  try {
    const [comments] = await pool.query(
      `SELECT c.id, c.content, c.created_at as createdAt,
      u.id as userId, u.username, u.profile_image as profileImage
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`,
      [id, limit, offset]
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
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error("Error al obtener comentarios:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

module.exports = {
  createPost,
  getPosts,
  getUserPosts,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  getPostComments,
}

/* 
Para middleware multer con filtro de solo imagen (opcional):

const multer = require("multer")

const upload = multer({
  storage: multer.diskStorage({ /* tu configuración * / }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imágenes"), false)
    }
    cb(null, true)
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // máximo 5MB
})

module.exports = upload

*/

