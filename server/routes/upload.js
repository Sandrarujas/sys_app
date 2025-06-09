const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const upload = require('../middleware/upload');

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const stream = cloudinary.uploader.upload_stream(
    { folder: 'images' }, // Cambia el nombre si quieres
    (error, result) => {
      if (error) return res.status(500).json({ message: error.message });
      res.json({ url: result.secure_url });
    }
  );

  stream.end(req.file.buffer);
});

module.exports = router;
