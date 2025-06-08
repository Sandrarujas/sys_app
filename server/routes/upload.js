const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { createPost  } = require('../controllers/postController');

router.post('/upload', upload.single('image'), createPost);


module.exports = router;
