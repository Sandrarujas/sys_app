// routes/upload.js
const express = require("express");
const router = express.Router();
const path = require("path");

// ✅ Usa Cloudinary en producción, disco local en desarrollo
const isProduction = process.env.NODE_ENV === "production";
const upload = isProduction
  ? require("../config/cloudinary")     // Cloudinary
  : require("../middleware/localUpload"); // Multer local (tu archivo con diskStorage)

router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se subió ninguna imagen" });
  }

  const imageUrl = isProduction
    ? req.file.path              // URL pública de Cloudinary
    : `/uploads/${req.file.filename}`; // Ruta local

  res.status(200).json({
    message: "Imagen subida exitosamente",
    url: imageUrl,
  });
});

module.exports = router;
