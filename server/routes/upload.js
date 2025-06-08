const express = require("express")
const router = express.Router()
const upload = require("../middlewares/multerConfig") // tu multer de disco
const { uploadImage } = require("../controllers/uploadController")

router.post("/upload", upload.single("image"), uploadImage)

module.exports = router
