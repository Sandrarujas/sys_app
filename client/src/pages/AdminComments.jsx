"use client"

import { useState, useEffect, useCallback } from "react"
import styles from "../styles/Admin.module.css"

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AdminComments = () => {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })
  const [currentPage, setCurrentPage] = useState(1)
  const [users, setUsers] = useState({})
  const [searchTerm, setSearchTerm] = useState("")

  const fetchUsername = useCallback(
    async (userId) => {
      if (users[userId]) return users[userId]

      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`${BASE_URL}/api/users/id/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const userData = await response.json()
          const username = userData.username || userData.name || `Usuario ${userId}`
          setUsers((prev) => ({ ...prev, [userId]: username }))
          return username
        }
      } catch (error) {
        console.error(`Error fetching username for ${userId}:`, error)
      }

      const fallback = `Usuario ${userId}`
      setUsers((prev) => ({ ...prev, [userId]: fallback }))
      return fallback
    },
    [users]
  )

  const fetchComments = useCallback(
    async (page = 1) => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`${BASE_URL}/api/admin/comments?page=${page}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()

          if (Array.isArray(data)) {
            setComments(data)
            setPagination({ total: data.length, pages: 1 }) // Ajusta si tu backend soporta paginación real
            data.forEach((comment) => fetchUsername(comment.user_id))
          } else {
            setComments([])
            setPagination({ total: 0, pages: 1 })
          }
        } else {
          const errorText = await response.text()
          console.error("Error en la respuesta:", response.status, errorText)
        }
      } catch (error) {
        console.error("Error fetching comments:", error)
      } finally {
        setLoading(false)
      }
    },
    [fetchUsername]
  )

  useEffect(() => {
    fetchComments(currentPage)
  }, [currentPage, fetchComments])

  const deleteComment = async (commentId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este comentario?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${BASE_URL}/api/admin/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        fetchComments(currentPage)
        alert("Comentario eliminado correctamente")
      } else {
        alert("Error al eliminar el comentario")
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
      alert("Error al eliminar el comentario")
    }
  }

  if (loading) {
    return <div className={styles["admin-loading"]}>Cargando comentarios...</div>
  }

  return (
    <div className={styles["admin-comments"]}>
      <div className={styles["admin-header"]}>
        <h1>Gestión de Comentarios</h1>
        <p>Total: {pagination?.total || 0} comentarios</p>
        <button onClick={() => fetchComments(currentPage)} className={styles["admin-btn"]}>
          Recargar
        </button>
        <input
          type="text"
          placeholder="Filtrar por nombre de usuario"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles["filter-input"]}
        />
      </div>

      <div className={styles["comments-list"]}>
        {comments && comments.length > 0 ? (
          comments
            .filter((comment) => {
              const username = users[comment.user_id]?.toLowerCase() || ""
              return username.includes(searchTerm.toLowerCase())
            })
            .map((comment) => (
              <div key={comment.id} className={styles["comment-card"]}>
                <div className={styles["comment-header"]}>
                  <div className={styles["comment-info"]}>
                    <span className={styles["comment-id"]}>ID: {comment.id}</span>
                    <span className={styles["comment-author"]}>
                      Por: {users[comment.user_id] || `Usuario ${comment.user_id}`}
                    </span>
                    <span className={styles["comment-date"]}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className={styles["comment-content"]}>
                  <p>
                    <strong>Comentario:</strong> {comment.content}
                  </p>
                  <p>
                    <strong>En publicación ID:</strong> {comment.post_id}
                  </p>
                </div>

                <div className={styles["comment-actions"]}>
                  <button
                    className={`${styles["action-btn"]} ${styles["delete"]}`}
                    onClick={() => deleteComment(comment.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
        ) : (
          <p>No hay comentarios para mostrar.</p>
        )}
      </div>

      <div className={styles.pagination}>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        <span>Página {currentPage}</span>
        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={pagination.pages && currentPage >= pagination.pages}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

export default AdminComments
