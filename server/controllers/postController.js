const pool = require("../config/db")
const cloudinary = require("../config/cloudinary")
const fs = require("fs")
const path = require("path")

// Crear una publicación
const createPost = async (req, res) => {
  const { content } = req.body
  const userId = req.user.id

  let image = null
  try {
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "Carpeta de fotos",
      })

      // Borrar archivo local temporal
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error borrando archivo local:", err)
      })

      image = result.secure_url
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

// Obtener todas las publicaciones con paginación (sin cambios)
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

// Obtener publicaciones de un usuario específico (sin cambios)
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

// Obtener todos los comentarios de una publicación con paginación (sin cambios)
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

// Dar like a una publicación (sin cambios)
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

// Quitar like de una publicación (sin cambios)
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

// Eliminar una publicación y su imagen en Cloudinary
const deletePost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    // Verificar que la publicación existe y pertenece al usuario
    const [posts] = await pool.query("SELECT * FROM posts WHERE id = ?", [id])
    if (posts.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" })
    }

    const post = posts[0]

    if (post.user_id !== userId) {
      return res.status(403).json({ message: "No tienes permiso para eliminar esta publicación" })
    }

    // Si la publicación tiene imagen, eliminarla de Cloudinary
    if (post.image) {
      // Extraer public_id de Cloudinary desde la URL de la imagen
      // Asumiendo que usas carpeta y que la URL tiene formato:
      // https://res.cloudinary.com/<cloud_name>/image/upload/v1234567/tu_carpeta_en_cloudinary/filename.jpg
      // Necesitamos obtener el public_id (sin extensión)

      const urlParts = post.image.split("/")
      const folderIndex = urlParts.findIndex((part) => part === "upload") + 1
      const publicIdWithExtension = urlParts.slice(folderIndex).join("/") // ej: "tu_carpeta_en_cloudinary/filename.jpg"
      const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, "") // quitar extensión

      try {
        await cloudinary.uploader.destroy(publicId)
      } catch (cloudErr) {
        console.error("Error borrando imagen en Cloudinary:", cloudErr)
      }
    }

    // Eliminar la publicación de la base de datos
    await pool.query("DELETE FROM posts WHERE id = ?", [id])

    res.json({ message: "Publicación eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar publicación:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}


const commentPost = async (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user.id;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ message: "El comentario no puede estar vacío" });
  }

  try {
    // Verificar que la publicación existe
    const [postExists] = await pool.query("SELECT id FROM posts WHERE id = ?", [postId]);
    if (postExists.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    // Insertar comentario
    const [result] = await pool.query(
      "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
      [postId, userId, content]
    );

    res.status(201).json({
      id: result.insertId,
      postId,
      userId,
      content,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error al comentar publicación:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};


// Actualizar una publicación con opción de cambiar imagen
const updatePost = async (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const userId = req.user.id

  try {
    // Verificar que la publicación existe y pertenece al usuario
    const [posts] = await pool.query("SELECT * FROM posts WHERE id = ?", [id])
    if (posts.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" })
    }

    const post = posts[0]

    if (post.user_id !== userId) {
      return res.status(403).json({ message: "No tienes permiso para editar esta publicación" })
    }

    let image = post.image // imagen actual

    if (req.file) {
      // Subir la nueva imagen a Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "Carpeta de fotos",
      })

      // Borrar archivo local temporal
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error borrando archivo local:", err)
      })

      // Borrar la imagen anterior de Cloudinary si existe
      if (post.image) {
        const urlParts = post.image.split("/")
        const folderIndex = urlParts.findIndex((part) => part === "upload") + 1
        const publicIdWithExtension = urlParts.slice(folderIndex).join("/")
        const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, "")

        try {
          await cloudinary.uploader.destroy(publicId)
        } catch (cloudErr) {
          console.error("Error borrando imagen anterior en Cloudinary:", cloudErr)
        }
      }

      image = result.secure_url
    }

    // Validar que haya contenido o imagen
    if (!content && !image) {
      return res.status(400).json({ message: "La publicación debe tener contenido o imagen" })
    }

    await pool.query(
      "UPDATE posts SET content = ?, image = ? WHERE id = ?",
      [content, image, id]
    )

    res.json({ message: "Publicación actualizada", content, image })
  } catch (error) {
    console.error("Error al actualizar publicación:", error)
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
  deletePost,
  updatePost,
  commentPost,
}
