const pool = require("../config/db")
const fs = require("fs")
const path = require("path")

// Obtener perfil de usuario
const getUserProfile = async (req, res) => {
  const { username } = req.params

  try {
    // Obtener información del usuario
    const [users] = await pool.query(
      `SELECT id, username, email, bio, profile_image as profileImage, 
      created_at as createdAt FROM users WHERE username = ?`,
      [username],
    )

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    const user = users[0]

    // Contar seguidores
    const [followersResult] = await pool.query("SELECT COUNT(*) as count FROM followers WHERE followed_id = ?", [
      user.id,
    ])

    // Contar seguidos
    const [followingResult] = await pool.query("SELECT COUNT(*) as count FROM followers WHERE follower_id = ?", [
      user.id,
    ])

    // Contar publicaciones
    const [postsResult] = await pool.query("SELECT COUNT(*) as count FROM posts WHERE user_id = ?", [user.id])

    // Contar comentarios recibidos en publicaciones del usuario
    const [commentsResult] = await pool.query(
      `SELECT COUNT(*) as count FROM comments c 
       JOIN posts p ON c.post_id = p.id 
       WHERE p.user_id = ?`,
      [user.id],
    )

    // Contar likes recibidos en publicaciones del usuario
    const [likesResult] = await pool.query(
      `SELECT COUNT(*) as count FROM likes l 
       JOIN posts p ON l.post_id = p.id 
       WHERE p.user_id = ?`,
      [user.id],
    )

    // Verificar si el usuario actual sigue a este usuario
    const [isFollowingResult] = await pool.query("SELECT * FROM followers WHERE follower_id = ? AND followed_id = ?", [
      req.user.id,
      user.id,
    ])

    res.json({
      ...user,
      followers: followersResult[0].count,
      following: followingResult[0].count,
      posts: postsResult[0].count,
      comments: commentsResult[0].count,
      likes: likesResult[0].count,
      isFollowing: isFollowingResult.length > 0,
    })
  } catch (error) {
    console.error("Error al obtener perfil:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// NUEVA FUNCIÓN: Obtener usuario por ID
const getUserById = async (req, res) => {
  const { id } = req.params

  try {
    // Obtener información básica del usuario por ID
    const [users] = await pool.query(
      `SELECT id, username, email, bio, profile_image as profileImage, 
      created_at as createdAt FROM users WHERE id = ?`,
      [id],
    )

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    const user = users[0]

    // Devolver solo la información básica del usuario
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profileImage: user.profileImage,
      createdAt: user.createdAt
    })
  } catch (error) {
    console.error("Error al obtener usuario por ID:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Actualizar biografía del usuario
const updateBio = async (req, res) => {
  const userId = req.user.id
  const { bio } = req.body

  if (!bio && bio !== "") {
    return res.status(400).json({ message: "La biografía es requerida" })
  }

  try {
    await pool.query("UPDATE users SET bio = ? WHERE id = ?", [bio, userId])
    res.json({ message: "Biografía actualizada exitosamente", bio })
  } catch (error) {
    console.error("Error al actualizar biografía:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Actualizar foto de perfil
const updateProfileImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se subió ninguna imagen" });
  }

  try {
    // Validar tipo de imagen
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path); // Elimina el archivo inválido
      return res.status(400).json({ message: "Formato de imagen no soportado" });
    }

    // Validar tamaño (ejemplo: 5MB máximo)
    if (req.file.size > 5 * 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "La imagen no puede superar 5MB" });
    }

    // Actualizar base de datos
    const profileImagePath = `/uploads/${req.file.filename}`;
    await pool.query("UPDATE users SET profile_image = ? WHERE id = ?", [profileImagePath, req.user.id]);

    res.json({ 
      message: "Imagen actualizada",
      profileImage: profileImagePath 
    });

  } catch (error) {
    console.error("Error crítico:", error);
    if (req.file) fs.unlinkSync(req.file.path); // Limpieza
    res.status(500).json({ message: "Error al procesar la imagen" });
  }
};

// Seguir a un usuario
const followUser = async (req, res) => {
  const { id } = req.params
  const followerId = req.user.id

  if (followerId === Number.parseInt(id)) {
    return res.status(400).json({ message: "No puedes seguirte a ti mismo" })
  }

  try {
    // Verificar si ya sigue al usuario
    const [existingFollow] = await pool.query("SELECT * FROM followers WHERE follower_id = ? AND followed_id = ?", [
      followerId,
      id,
    ])

    if (existingFollow.length > 0) {
      return res.status(400).json({ message: "Ya sigues a este usuario" })
    }

    // Crear relación de seguimiento
    await pool.query("INSERT INTO followers (follower_id, followed_id) VALUES (?, ?)", [followerId, id])

    // Crear notificación
    await pool.query("INSERT INTO notifications (user_id, sender_id, type) VALUES (?, ?, 'follow')", [id, followerId])

    res.status(201).json({ message: "Usuario seguido exitosamente" })
  } catch (error) {
    console.error("Error al seguir usuario:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

// Dejar de seguir a un usuario
const unfollowUser = async (req, res) => {
  const { id } = req.params
  const followerId = req.user.id

  try {
    // Eliminar relación de seguimiento
    await pool.query("DELETE FROM followers WHERE follower_id = ? AND followed_id = ?", [followerId, id])

    res.json({ message: "Dejaste de seguir al usuario exitosamente" })
  } catch (error) {
    console.error("Error al dejar de seguir usuario:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
}

module.exports = {
  getUserProfile,
  getUserById,  // NUEVA FUNCIÓN EXPORTADA
  updateBio,
  updateProfileImage,
  followUser,
  unfollowUser,
}