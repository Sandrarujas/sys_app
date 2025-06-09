const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { authenticateToken } = require("../middleware/auth")
const { createPostValidators, commentValidators } = require("../middleware/validators")
const {
  createPost,
  getPosts,
  getUserPosts,
  getPostComments,
  likePost,
  commentPost,
  updatePost,
  deletePost,
  getPostById,
} = require("../controllers/postController")

// Asegurarse de que la carpeta uploads existe
const uploadsDir = path.join(__dirname, "..", "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    // Generar un nombre único para evitar colisiones
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    // Obtener la extensión original del archivo
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, uniqueSuffix + ext)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, gif)"))
  },
})

// Middleware para manejar errores de multer
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "El archivo es demasiado grande. Máximo 5MB." })
    }
    return res.status(400).json({ message: `Error en la subida: ${err.message}` })
  } else if (err) {
    return res.status(400).json({ message: err.message })
  }
  next()
}

// Crear una publicación
router.post("/", authenticateToken, upload.single("image"), handleMulterErrors, createPostValidators, createPost)

// Obtener todas las publicaciones
router.get("/", authenticateToken, getPosts)

// Obtener publicaciones de un usuario específico
router.get("/user/:username", authenticateToken, getUserPosts)

// Obtener todos los comentarios de una publicación
router.get("/:id/comments", authenticateToken, getPostComments)

// Dar like a una publicación
router.post("/:id/like", authenticateToken, likePost)

// Comentar en una publicación
router.post("/:id/comment", authenticateToken, commentValidators, commentPost)

// NUEVAS RUTAS

// Actualizar una publicación
router.put("/:id", authenticateToken, upload.single("image"), handleMulterErrors, createPostValidators, updatePost)

// Eliminar una publicación
router.delete("/:id", authenticateToken, deletePost)


// Obtener una publicación específica por ID
router.get("/:id", authenticateToken, getPostById)

module.exports = router
