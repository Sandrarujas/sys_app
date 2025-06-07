import { Link } from "react-router-dom"
import styles from "../styles/NoAccess.module.css"

const NoAccess = () => {
  return (
    <div className={styles["noaccess-wrapper"]}>
      <h2>Acceso denegado</h2>
      <p>No tienes permisos para ver esta página.</p>
      <Link to="/login" className={styles.button}>Iniciar sesión</Link>
    </div>
  )
}

export default NoAccess
