const pool = require("../config/db")
const fs = require("fs")
const path = require("path")

// Crear una publicación
const createPost = async (req, res) => {
  const { content } = req.body
  const userId = req.user.id

  // Verificar si hay un archivo adjunto
  let image = null
  if (req.file) {
    // Asegurarse de que la ruta sea correcta para acceso desde el cliente
    // Usar una ruta relativa al servidor para almacenar en la base de datos
    image = `/uploads/${req.file.filename}`
    console.log("Imagen subida:", image)
    console.log("Ruta completa:", path.join(__dirname, "..", "uploads", req.file.filename))
  }

  if (!content && !image) {
    return res.status(400).json({ message: "La publicación debe tener contenido o imagen" })
  }

  try {
    const [result] = await pool.query("INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)", [
      userId,
      content,
      image,
    ])

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
    // Obtener publicaciones de usuarios que sigue el usuario actual y del propio usuario
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

    // Contar total de publicaciones para la paginación
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

    // Para cada publicación, obtener likes y comentarios
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        // Contar likes
        const [likesResult] = await pool.query("SELECT COUNT(*) as count FROM likes WHERE post_id = ?", [post.id])

        // Verificar si el usuario actual dio like
        const [userLiked] = await pool.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [post.id, userId])

        // Obtener comentarios (limitados a los 5 más recientes)
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

        // Contar total de comentarios
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
    // Obtener ID del usuario por username
    const [users] = await pool.query("SELECT id FROM users WHERE username = ?", [username])

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    const profileUserId = users[0].id

    // Obtener publicaciones del usuario
    const [posts] = await pool.query(
      `SELECT p.id, p.content, p.image, p.created_at as createdAt,
      u.id as userId, u.username, u.profile_image as profileImage
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC`,
      [profileUserId],
    )

    // Para cada publicación, obtener likes y comentarios
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        // Contar likes
        const [likesResult] = await pool.query("SELECT COUNT(*) as count FROM likes WHERE post_id = ?", [post.id])

        // Verificar si el usuario actual dio like
        const [userLiked] = await pool.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [post.id, userId])

        // Obtener comentarios
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
    // Verificar si la publicación existe
    const [postExists] = await pool.query("SELECT id FROM posts WHERE id = ?", [id])

    if (postExists.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" })
    }

    // Obtener comentarios paginados
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

    // Contar total de comentarios
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
    // Verificar si ya dio like
    const [existingLike] = await pool.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [id, userId])

    if (existingLike.length > 0) {
      // Si ya dio like, eliminar el like
      await pool.query("DELETE FROM likes WHERE post_id = ? AND user_id = ?", [id, userId])

      res.json({ message: "Like eliminado" })
    } else {
      // Si no ha dado like, crear like
      await pool.query("INSERT INTO likes (post_id, user_id) VALUES (?, ?)", [id, userId])

      // Obtener el propietario de la publicación
      const [postOwner] = await pool.query("SELECT user_id FROM posts WHERE id = ?", [id])

      // Si el usuario que da like no es el propietario, crear notificación
      if (postOwner.length > 0 && postOwner[0].user_id !== userId) {
        await pool.query("INSERT INTO notifications (user_id, sender_id, type, post_id) VALUES (?, ?, 'like', ?)", [
          postOwner[0].user_id,
          userId,
          id,
        ])
      }

      res.status(201).json({ message: "Like agregado" })
    }
  } catch (error) {
    console.error("Error al dar like:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Comentar en una publicación
const commentPost = async (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const userId = req.user.id

  try {
    // Verificar si la publicación existe
    const [postExists] = await pool.query("SELECT id, user_id FROM posts WHERE id = ?", [id])

    if (postExists.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" })
    }

    // Crear comentario
    const [result] = await pool.query("INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)", [
      id,
      userId,
      content,
    ])

    // Si el usuario que comenta no es el propietario, crear notificación
    if (postExists[0].user_id !== userId) {
      await pool.query(
        "INSERT INTO notifications (user_id, sender_id, type, post_id, comment_id) VALUES (?, ?, 'comment', ?, ?)",
        [postExists[0].user_id, userId, id, result.insertId],
      )
    }

    // Obtener información del usuario
    const [users] = await pool.query("SELECT id, username, profile_image as profileImage FROM users WHERE id = ?", [
      userId,
    ])

    res.status(201).json({
      id: result.insertId,
      content,
      createdAt: new Date(),
      user: {
        id: users[0].id,
        username: users[0].username,
        profileImage: users[0].profileImage,
      },
    })
  } catch (error) {
    console.error("Error al comentar:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// NUEVAS FUNCIONES

// Actualizar una publicación
const updatePost = async (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const userId = req.user.id

  try {
    // Verificar si la publicación existe y pertenece al usuario
    const [post] = await pool.query("SELECT * FROM posts WHERE id = ?", [id])

    if (post.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" })
    }

    if (post[0].user_id !== userId) {
      return res.status(403).json({ message: "No tienes permiso para editar esta publicación" })
    }

    // Verificar si hay un archivo adjunto
    let image = post[0].image
    if (req.file) {
      // Si hay una imagen anterior, eliminarla
      if (post[0].image) {
        const oldImagePath = path.join(__dirname, "..", post[0].image)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }

      // Usar una ruta relativa al servidor para almacenar en la base de datos
      image = `/uploads/${req.file.filename}`
      console.log("Nueva imagen subida:", image)
    }

    // Si no hay contenido ni imagen, devolver error
    if (!content && !image) {
      return res.status(400).json({ message: "La publicación debe tener contenido o imagen" })
    }

    // Actualizar la publicación
    await pool.query("UPDATE posts SET content = ?, image = ? WHERE id = ?", [content, image, id])

    res.json({
      id: Number.parseInt(id),
      content,
      image,
      updatedAt: new Date(),
    })
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
    // Verificar si la publicación existe y pertenece al usuario
    const [post] = await pool.query("SELECT * FROM posts WHERE id = ?", [id])

    if (post.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" })
    }

    if (post[0].user_id !== userId) {
      return res.status(403).json({ message: "No tienes permiso para eliminar esta publicación" })
    }

    // Si hay una imagen, eliminarla
    if (post[0].image) {
      const imagePath = path.join(__dirname, "..", post[0].image)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    // Eliminar likes, comentarios y notificaciones relacionadas con la publicación
    await pool.query("DELETE FROM likes WHERE post_id = ?", [id])
    await pool.query("DELETE FROM comments WHERE post_id = ?", [id])
    await pool.query("DELETE FROM notifications WHERE post_id = ?", [id])

    // Eliminar la publicación
    await pool.query("DELETE FROM posts WHERE id = ?", [id])

    res.json({ message: "Publicación eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar publicación:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Añadir esta función al controlador de posts

// Obtener una publicación específica
const getPostById = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    // Obtener la publicación con información del usuario
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

    // Contar likes
    const [likesResult] = await pool.query("SELECT COUNT(*) as count FROM likes WHERE post_id = ?", [id])

    // Verificar si el usuario actual dio like
    const [userLiked] = await pool.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [id, userId])

    // Obtener comentarios
    const [comments] = await pool.query(
      `SELECT c.id, c.content, c.created_at as createdAt,
      u.id as userId, u.username, u.profile_image as profileImage
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
      LIMIT 5`,
      [id],
    )

    // Contar total de comentarios
    const [commentCount] = await pool.query("SELECT COUNT(*) as count FROM comments WHERE post_id = ?", [id])

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
      commentCount: commentCount[0].count,
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
  commentPost,
  updatePost,
  deletePost,
  getPostById,
}
