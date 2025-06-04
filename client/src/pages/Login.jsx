"use client"

import { useState, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import styles from "../styles/Login.module.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const { email, password } = formData

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Por favor complete todos los campos")
      return
    }

    const success = await login(email, password)
    if (success) {
      navigate("/")
    } else {
      setError("Credenciales inválidas")
    }
  }

return (
  <div className={styles["login-container"]}>
    <div className={styles["login-overlay"]}></div>

    <div className={styles["login-content"]}>
      <div className={styles["login-welcome"]}>
        <h1>
          SAVE
          <br />
          your soul
        </h1>
        <p>La vida se ve mejor desde arriba ¿Empezamos?</p>

        <div className={styles["social-icons"]}>
          <a href="#" className={styles["social-icon"]}>
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="#" className={styles["social-icon"]}>
            <i className="fab fa-twitter"></i>
          </a>
          <a href="#" className={styles["social-icon"]}>
            <i className="fab fa-instagram"></i>
          </a>
        </div>
      </div>

      <div className={styles["login-form-container"]}>
        <div className={styles["login-form-wrapper"]}>
          <h2>Iniciar Sesión</h2>

          {error && <div className={styles["login-error"]}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles["login-form"]}>
            <div className={styles["form-group"]}>
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

            <div className={styles["form-group"]}>
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

            <div className={styles["form-options"]}>
              <div className={styles["remember-me"]}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <label htmlFor="rememberMe">Recordarme</label>
              </div>
              <Link to="/forgot-password" className={styles["forgot-password"]}>
                ¿Olvidó su contraseña?
              </Link>
            </div>

            <button type="submit" className={styles["login-button"]}>
              Iniciar Sesión
            </button>
          </form>

          <div className={styles["login-footer"]}>
            <p>
              ¿No tiene una cuenta? <Link to="/register">Regístrese</Link>
            </p>
            <div className={styles["terms"]}>
              <Link to="/terms">Términos de servicio</Link> | <Link to="/privacy">Política de privacidad</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

export default Login
