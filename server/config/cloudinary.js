// config/cloudinary.js
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configurar con variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Almacenamiento con multer y Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "uploads", // Carpeta en tu cuenta Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
  },
});

const upload = require("multer")({ storage });

module.exports = upload;