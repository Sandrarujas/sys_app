const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("mulinary-storage-cloudinary");

// Configura Cloudinary con tus credenciales (asegúrate de usar variables de entorno)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuración de multer para subir imágenes a Cloudinary directamente:
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Carpeta de fotos", // Carpeta donde se almacenarán las imágenes
    allowedFormats: ["jpg", "jpeg", "png", "gif"],
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imágenes"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
});

module.exports = upload;
module.exports.cloudinary = cloudinary;  // exporta también para usar en controladores
