"use client"

import { useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import SearchBar from "./SearchBar"
import NotificationList from "./NotificationList"
import styles from "../styles/Navbar.module.css"

const Navbar = () => {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles["navbar-container"]}>
        <Link to="/" className={styles["navbar-logo"]}>
          SYS
        </Link>

        {user && <SearchBar />}

        {user ? (
          <ul className={styles["navbar-menu"]}>
            <li className={styles["navbar-item"]}>
              <Link to="/" className={styles["navbar-link"]}>
                Inicio
              </Link>
            </li>
            <li className={styles["navbar-item"]}>
              <Link to="/create-post" className={styles["navbar-link"]}>
                Crear Publicación
              </Link>
            </li>
            <li className={styles["navbar-item"]}>
              <Link to={`/profile/${user.username}`} className={styles["navbar-link"]}>
                Perfil
              </Link>
            </li>

            {user?.role === "admin" && (
              <li className={styles["navbar-item"]}>
                <Link to="/admin" className={`${styles["navbar-link"]} ${styles["admin-link"]}`}>
                  Panel del Administrador
                </Link>
              </li>
            )}

            <li className={styles["navbar-item"]}>
              <NotificationList />
            </li>
            <li className={styles["navbar-item"]}>
              <button onClick={handleLogout} className={styles["navbar-button"]}>
                Cerrar Sesión
              </button>
            </li>
          </ul>
        ) : (
          <ul className={styles["navbar-menu"]}>
            <li className={styles["navbar-item"]}>
              <Link to="/login" className={styles["navbar-link"]}>
                Iniciar Sesión
              </Link>
            </li>
            <li className={styles["navbar-item"]}>
              <Link to="/register" className={styles["navbar-link"]}>
                Registrarse
              </Link>
            </li>
          </ul>
        )}
      </div>
    </nav>
  )
}

export default Navbar
