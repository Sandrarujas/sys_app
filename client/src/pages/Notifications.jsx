"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import styles from "../styles/Notifications.module.css"

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const [selectedNotification, setSelectedNotification] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const res = await axios.get(
          `/api/notifications?page=${pagination.page}&limit=${pagination.limit}`
        )
        setNotifications(res.data.notifications)
        setPagination(res.data.pagination)
        setLoading(false)
      } catch (error) {
        console.error("Error al cargar notificaciones:", error)
        setError("No se pudieron cargar las notificaciones")
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [pagination.page, pagination.limit])

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`)
      setNotifications(
        notifications.map((notif) =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      )
    } catch (error) {
      console.error("Error al marcar notificación:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.put("/api/notifications/read-all")
      setNotifications(notifications.map((notif) => ({ ...notif, isRead: true })))
    } catch (error) {
      console.error("Error al marcar todas las notificaciones:", error)
    }
  }

  const getNotificationContent = (notification) => {
    const { type, senderUsername } = notification
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

  const getNotificationLink = (notification) => {
    const { type, postId, senderUsername } = notification
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
    const baseClass = styles["notification-icon"]
    switch (type) {
      case "like":
        return <i className={`${baseClass} ${styles["like"]} fas fa-heart`} />
      case "comment":
        return <i className={`${baseClass} ${styles["comment"]} fas fa-comment`} />
      case "follow":
        return <i className={`${baseClass} ${styles["follow"]} fas fa-user-plus`} />
      default:
        return <i className={`${baseClass} fas fa-bell`} />
    }
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.svg?height=40&width=40"
    if (imagePath.startsWith("http")) return imagePath
    return `${imagePath}`
  }

  const openNotificationModal = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    setSelectedNotification(notification)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedNotification(null)
  }

  const navigateToContent = () => {
    if (selectedNotification) {
      const link = getNotificationLink(selectedNotification)
      closeModal()
      navigate(link)
    }
  }

  const navigateToUserProfile = () => {
    if (selectedNotification) {
      closeModal()
      navigate(`/profile/${selectedNotification.senderUsername}`)
    }
  }

  return (
    <div className={styles["notifications-page"]}>
      <div className={styles["notifications-header"]}>
        <h1>Notificaciones</h1>
        <button className={styles["mark-all-read-btn"]} onClick={markAllAsRead}>
          Marcar todas como leídas
        </button>
      </div>

      {loading ? (
        <div className={styles["notifications-loading"]}>Cargando notificaciones...</div>
      ) : error ? (
        <div className={styles["notifications-error"]}>{error}</div>
      ) : notifications.length > 0 ? (
        <div className={styles["notifications-list"]}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`${styles["notification-item"]} ${
                !notification.isRead ? styles["notification-item-unread"] : ""
              }`}
              onClick={() => openNotificationModal(notification)}
            >
              <div className={styles["notification-avatar"]}>
                <img
                  src={getImageUrl(notification.senderProfileImage)}
                  alt={notification.senderUsername}
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=40&width=40"
                  }}
                />
                {getNotificationIcon(notification.type)}
              </div>
              <div className={styles["notification-content"]}>
                <p>{getNotificationContent(notification)}</p>
                <span className={styles["notification-time"]}>
                  {new Date(notification.createdAt).toLocaleDateString()}{" "}
                  {new Date(notification.createdAt).toLocaleTimeString()}
                </span>
              </div>
              {!notification.isRead && <div className={styles["notification-dot"]} />}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles["notifications-empty"]}>No tienes notificaciones</div>
      )}

      {pagination.totalPages > 1 && (
        <div className={styles["notifications-pagination"]}>
          <button
            className={styles["pagination-button"]}
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page - 1 })
            }
            disabled={pagination.page === 1 || loading}
          >
            Anterior
          </button>
          <div className={styles["pagination-info"]}>
            Página {pagination.page} de {pagination.totalPages}
          </div>
          <button
            className={styles["pagination-button"]}
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page + 1 })
            }
            disabled={pagination.page === pagination.totalPages || loading}
          >
            Siguiente
          </button>
        </div>
      )}

      {showModal && selectedNotification && (
        <div
          className={styles["notification-modal-overlay"]}
          onClick={closeModal}
        >
          <div
            className={styles["notification-modal"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["notification-modal-header"]}>
              <h3>Notificación</h3>
              <button className={styles["close-modal"]} onClick={closeModal}>
                ×
              </button>
            </div>
            <div className={styles["notification-modal-content"]}>
              <div className={styles["notification-modal-user"]}>
                <img
                  src={getImageUrl(selectedNotification.senderProfileImage)}
                  alt={selectedNotification.senderUsername}
                  className={styles["notification-modal-avatar"]}
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=60&width=60"
                  }}
                />
                <div className={styles["notification-modal-user-info"]}>
                  <h4>{selectedNotification.senderUsername}</h4>
                  <p className={styles["notification-modal-time"]}>
                    {new Date(selectedNotification.createdAt).toLocaleDateString()}{" "}
                    {new Date(selectedNotification.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className={styles["notification-modal-message"]}>
                <p>{getNotificationContent(selectedNotification)}</p>
              </div>
              <div className={styles["notification-modal-actions"]}>
                <button
                  className={`${styles["notification-modal-btn"]} ${styles["profile"]}`}
                  onClick={navigateToUserProfile}
                >
                  Ver perfil de {selectedNotification.senderUsername}
                </button>
                {selectedNotification.type !== "follow" && (
                  <button
                    className={`${styles["notification-modal-btn"]} ${styles["content"]}`}
                    onClick={navigateToContent}
                  >
                    {selectedNotification.type === "like"
                      ? "Ver publicación"
                      : "Ver comentario"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Notifications
