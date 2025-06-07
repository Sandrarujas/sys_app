"use client"

import { useContext, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import SearchBar from "./SearchBar"
import NotificationList from "./NotificationList"
import styles from "../styles/Navbar.module.css"

const Navbar = () => {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
    setMenuOpen(false)
  }

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev)
  }

  const closeMenu = () => {
    setMenuOpen(false)
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles["navbar-container"]}>
        <Link to="/" className={styles["navbar-logo"]} onClick={closeMenu}>
          SYS
        </Link>

        {user && <SearchBar />}

        <button
          className={styles["navbar-toggle"]}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <i className="fas fa-bars"></i>
        </button>

        <ul className={`${styles["navbar-menu"]} ${menuOpen ? styles.active : ""}`}>
          {user ? (
            <>
              <li className={styles["navbar-item"]}>
                <Link to="/" className={styles["navbar-link"]} onClick={closeMenu}>
                  Inicio
                </Link>
              </li>
              <li className={styles["navbar-item"]}>
                <Link
                  to="/create-post"
                  className={styles["navbar-link"]}
                  onClick={closeMenu}
                >
                  Crear Publicación
                </Link>
              </li>
              <li className={styles["navbar-item"]}>
                <Link
                  to={`/profile/${user.username}`}
                  className={styles["navbar-link"]}
                  onClick={closeMenu}
                >
                  Perfil
                </Link>
              </li>

              {user?.role === "admin" && (
                <li className={styles["navbar-item"]}>
                  <Link
                    to="/admin"
                    className={`${styles["navbar-link"]} ${styles["admin-link"]}`}
                    onClick={closeMenu}
                  >
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
            </>
          ) : (
            <>
              <li className={styles["navbar-item"]}>
                <Link to="/login" className={styles["navbar-link"]} onClick={closeMenu}>
                  Iniciar Sesión
                </Link>
              </li>
              <li className={styles["navbar-item"]}>
                <Link to="/register" className={styles["navbar-link"]} onClick={closeMenu}>
                  Registrarse
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
