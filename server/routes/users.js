const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")
const upload = require("../middleware/upload")
const {
  getUserProfile,
  getUserById,  // NUEVA FUNCIÓN QUE NECESITAMOS AGREGAR
  updateBio,
  updateProfileImage,
  followUser,
  unfollowUser,
} = require("../controllers/userController")

// Obtener usuario por ID (NUEVA RUTA)
router.get("/id/:id", authenticateToken, getUserById)

// Obtener perfil de usuario por username
router.get("/:username", authenticateToken, getUserProfile)

// Actualizar biografía
router.put("/bio", authenticateToken, updateBio)

// Actualizar foto de perfil
router.put("/profile-image", authenticateToken, upload.single("profileImage"), updateProfileImage)

// Seguir a un usuario
router.post("/:id/follow", authenticateToken, followUser)

// Dejar de seguir a un usuario
router.delete("/:id/unfollow", authenticateToken, unfollowUser)

module.exports = router