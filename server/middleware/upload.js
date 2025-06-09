const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'socialapp_uploads', // Carpeta en Cloudinary donde se guardarán las imágenes
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

const upload = multer({ storage });

module.exports = upload;
