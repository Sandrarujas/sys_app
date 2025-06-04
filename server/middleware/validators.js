const { body, validationResult } = require("express-validator")

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log("Errores de validación:", errors.array())
    return res.status(400).json({
      message: "Error de validación",
      errors: errors.array(),
    })
  }
  next()
}

// Validadores para registro de usuario
const registerValidators = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("El nombre de usuario debe tener entre 3 y 30 caracteres")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("El nombre de usuario solo puede contener letras, números y guiones bajos"),
  body("email").isEmail().withMessage("Debe proporcionar un email válido"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres")
    .matches(/\d/)
    .withMessage("La contraseña debe contener al menos un número"),
  handleValidationErrors,
]

// Validadores para login
const loginValidators = [
  body("email").isEmail().withMessage("Debe proporcionar un email válido"),
  body("password").notEmpty().withMessage("La contraseña es requerida"),
  handleValidationErrors,
]

// Validadores para crear publicación
const createPostValidators = [
  body("content").optional().isLength({ max: 500 }).withMessage("El contenido no puede exceder los 500 caracteres"),
  handleValidationErrors,
]

// Validadores para comentarios
const commentValidators = [
  body("content")
    .notEmpty()
    .withMessage("El comentario no puede estar vacío")
    .isLength({ max: 200 })
    .withMessage("El comentario no puede exceder los 200 caracteres"),
  handleValidationErrors,
]

module.exports = {
  registerValidators,
  loginValidators,
  createPostValidators,
  commentValidators,
}
