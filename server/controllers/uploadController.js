const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se ha enviado ningún archivo' });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'tu_carpeta_en_cloudinary', // Cambia esto
    });

    // Borrar archivo local
    fs.unlink(req.file.path, err => {
      if (err) console.error('Error borrando archivo local:', err);
    });

    res.status(200).json({
      message: 'Imagen subida correctamente',
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error subiendo la imagen', error: error.message });
  }
};

module.exports = { uploadImage };
