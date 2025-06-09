const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { createPostValidators, commentValidators } = require("../middleware/validators");
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
} = require("../controllers/postController");

// Importar middleware de subida desde config/upload.js (Multer con memoryStorage)
const upload = require("../middleware/upload");

// Middleware para manejar errores de subida
const handleUploadErrors = (err, req, res, next) => {
  if (err) {
    console.error("Error en la subida de archivo:", err.message);
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Crear una publicación
router.post(
  "/",
  authenticateToken,
  upload.single("image"),
  handleUploadErrors,
  createPostValidators,
  createPost
);

// Obtener todas las publicaciones
router.get("/", authenticateToken, getPosts);

// Obtener publicaciones de un usuario específico
router.get("/user/:username", authenticateToken, getUserPosts);

// Obtener comentarios de una publicación
router.get("/:id/comments", authenticateToken, getPostComments);

// Dar like a una publicación
router.post("/:id/like", authenticateToken, likePost);

// Comentar en una publicación
router.post("/:id/comment", authenticateToken, commentValidators, commentPost);

// Actualizar publicación
router.put(
  "/:id",
  authenticateToken,
  upload.single("image"),
  handleUploadErrors,
  createPostValidators,
  updatePost
);

// Eliminar publicación
router.delete("/:id", authenticateToken, deletePost);

// Obtener publicación específica
router.get("/:id", authenticateToken, getPostById);

module.exports = router;
