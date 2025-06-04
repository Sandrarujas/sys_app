"use client"

import { useState, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const { register } = useContext(AuthContext)
  const navigate = useNavigate()

  const { username, email, password, confirmPassword } = formData

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!username || !email || !password || !confirmPassword) {
      setError("Por favor complete todos los campos")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    const result = await register(username, email, password)
    if (result.success) {
      navigate("/")
    } else {
      setError(result.message || "Error al registrarse")
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h1>Registrarse</h1>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Nombre de Usuario</label>
            <input
              type="text"
              name="username"
              id="username"
              value={username}
              onChange={handleChange}
              placeholder="Ingrese su nombre de usuario"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={handleChange}
              placeholder="Ingrese su email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={handleChange}
              placeholder="Ingrese su contraseña"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              placeholder="Confirme su contraseña"
            />
          </div>
          <button type="submit" className="auth-button">
            Registrarse
          </button>
        </form>
        <p className="auth-redirect">
          ¿Ya tiene una cuenta? <Link to="/login">Inicie Sesión</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
