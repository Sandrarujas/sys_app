"use client"

import { useState, useEffect, useContext } from "react"
import { Link } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import styles from "../styles/Notifications.module.css"

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const NotificationList = () => {
  const {
    notifications,
    unreadCount,
    notificationsLoading,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useContext(AuthContext)

  const [showDropdown, setShowDropdown] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (showDropdown) {
      fetchNotifications().catch(() => {
        setError("No se pudieron cargar las notificaciones")
      })
    }
  }, [showDropdown, fetchNotifications])

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id)
    } catch (error) {
      console.error("Error al marcar notificación:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
    } catch (error) {
      console.error("Error al marcar todas las notificaciones:", error)
    }
  }

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev)
    setError("")
  }

  const getNotificationContent = ({ type, senderUsername }) => {
    switch (type) {
      case "like":
        return `${senderUsername} le dio like a tu publicación`
      case "comment":
        return `${senderUsername} comentó en tu publicación`
      case "follow":
        return `${senderUsername} comenzó a seguirte`
      default:
        return `Nueva notificación de ${senderUsername}`
    }
  }

  const getNotificationLink = ({ type, postId, senderUsername }) => {
    switch (type) {
      case "like":
      case "comment":
        return `/post/${postId}`
      case "follow":
        return `/profile/${senderUsername}`
      default:
        return "#"
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <i className={`fas fa-heart ${styles["notification-icon"]} ${styles.like}`}></i>
      case "comment":
        return <i className={`fas fa-comment ${styles["notification-icon"]} ${styles.comment}`}></i>
      case "follow":
        return <i className={`fas fa-user-plus ${styles["notification-icon"]} ${styles.follow}`}></i>
      default:
        return <i className={`fas fa-bell ${styles["notification-icon"]}`}></i>
    }
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return "/placeholder.svg?height=40&width=40"
    return imagePath.startsWith("http") ? imagePath : `${BASE_URL}${imagePath}`
  }

  return (
    <div className={styles["notification-container"]}>
      <div className={styles["notification-bell"]} onClick={toggleDropdown} role="button" tabIndex={0} aria-label="Mostrar notificaciones">
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && <span className={styles["notification-badge"]}>{unreadCount}</span>}
      </div>

      {showDropdown && (
        <div className={styles["notification-dropdown"]}>
          <div className={styles["notification-header"]}>
            <h3>Notificaciones</h3>
            {unreadCount > 0 && (
              <button className={styles["mark-all-read"]} onClick={handleMarkAllAsRead}>
                Marcar todas como leídas
              </button>
            )}
          </div>

          {notificationsLoading ? (
            <div className={styles["notification-loading"]}>Cargando...</div>
          ) : error ? (
            <div className={styles["notification-error"]}>{error}</div>
          ) : notifications.length > 0 ? (
            <div className={styles["notification-list"]}>
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={getNotificationLink(notification)}
                  className={`${styles["notification-item"]} ${!notification.isRead ? styles["unread"] : ""}`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <div className={styles["notification-avatar"]}>
                    <img
                      src={getImageUrl(notification.senderProfileImage)}
                      alt={notification.senderUsername}
                      className="notification-user-image"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=40&width=40"
                      }}
                    />
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className={styles["notification-content"]}>
                    <p>{getNotificationContent(notification)}</p>
                    <span className={styles["notification-time"]}>
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {!notification.isRead && <div className={styles["notification-dot"]}></div>}
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles["notification-empty"]}>No tienes notificaciones</div>
          )}

          <div className={styles["notification-footer"]}>
            <Link to="/notifications" className={styles["view-all"]}>
              Ver todas las notificaciones
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationList
