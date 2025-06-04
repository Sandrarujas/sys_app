"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { Link } from "react-router-dom"
import styles from "../styles/Admin.module.css"  // Importando CSS modular

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        const errorText = await response.text()
        console.error("Error en la respuesta:", errorText)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className={styles["admin-loading"]}>Cargando dashboard...</div>
  }

  return (
    <div className={styles["admin-dashboard"]}>
      <div className={styles["admin-header"]}>
        <h1>Panel de Administración</h1>
        <p>Bienvenido, {user?.username || "Admin"}</p>
      </div>

      <div className={styles["stats-grid"]}>
        <div className={styles["stat-card"]}>
          <h3>Usuarios Totales</h3>
          <div className={styles["stat-number"]}>{stats?.users?.total_users || 0}</div>
          <div className={styles["stat-subtitle"]}>+{stats?.users?.new_users_month || 0} este mes</div>
        </div>

        <div className={styles["stat-card"]}>
          <h3>Publicaciones Totales</h3>
          <div className={styles["stat-number"]}>{stats?.posts?.total_posts || 0}</div>
          <div className={styles["stat-subtitle"]}>+{stats?.posts?.new_posts_month || 0} este mes</div>
        </div>

        <div className={styles["stat-card"]}>
          <h3>Comentarios Totales</h3>
          <div className={styles["stat-number"]}>{stats?.comments?.total_comments || 0}</div>
          <div className={styles["stat-subtitle"]}>Total en la plataforma</div>
        </div>
      </div>

      <div className={styles["admin-actions"]}>
        <div className={styles["action-card"]}>
          <h3>Gestión de Usuarios</h3>
          <p>Administrar usuarios y eliminar cuentas</p>
          <Link to="/admin/users" className={styles["admin-btn"]}>
            Gestionar Usuarios
          </Link>
        </div>

        <div className={styles["action-card"]}>
          <h3>Gestión de Publicaciones</h3>
          <p>Moderar y eliminar publicaciones</p>
          <Link to="/admin/posts" className={styles["admin-btn"]}>
            Gestionar Posts
          </Link>
        </div>

        <div className={styles["action-card"]}>
          <h3>Gestión de Comentarios</h3>
          <p>Moderar y eliminar comentarios</p>
          <Link to="/admin/comments" className={styles["admin-btn"]}>
            Gestionar Comentarios
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
