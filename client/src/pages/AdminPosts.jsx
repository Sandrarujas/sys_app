"use client"

import { useState, useEffect, useCallback } from "react"
import styles from "../styles/Admin.module.css"

const AdminPosts = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })
  const [currentPage, setCurrentPage] = useState(1)
  const [users, setUsers] = useState({})
  const [searchTerm, setSearchTerm] = useState("") // 👈 nuevo estado para filtrar

  const fetchUsername = useCallback(async (userId) => {
    if (users[userId]) return users[userId]

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/users/id/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        const username = userData.username || userData.name || `Usuario ${userId}`
        setUsers(prev => ({ ...prev, [userId]: username }))
        return username
      }
    } catch (error) {
      console.error(`Error fetching username for ${userId}:`, error)
    }

    const fallback = `Usuario ${userId}`
    setUsers(prev => ({ ...prev, [userId]: fallback }))
    return fallback
  }, [users])

  const fetchPosts = useCallback(async (page = 1) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/admin/posts?page=${page}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setPosts(data)
          setPagination({ total: data.length, pages: 1 })
          data.forEach(post => {
            fetchUsername(post.user_id)
          })
        } else {
          setPosts([])
          setPagination({ total: 0, pages: 1 })
        }
      } else {
        const errorText = await response.text()
        console.error("Error en la respuesta:", response.status, errorText)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }, [fetchUsername])

  useEffect(() => {
    fetchPosts(currentPage)
  }, [currentPage, fetchPosts])

  const deletePost = async (postId) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar esta publicación?`)) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchPosts(currentPage)
        alert("Publicación eliminada correctamente")
      } else {
        alert("Error al eliminar la publicación")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Error al eliminar la publicación")
    }
  }

  const truncateContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  if (loading) {
    return <div className={styles["admin-loading"]}>Cargando publicaciones...</div>
  }

  return (
    <div className={styles["admin-posts"]}>
      <div className={styles["admin-header"]}>
        <h1>Gestión de Publicaciones</h1>
        <p>Total: {pagination?.total || 0} publicaciones</p>
        <button onClick={() => fetchPosts(currentPage)} className={styles["admin-btn"]}>
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

      <div className={styles["posts-list"]}>
        {posts && posts.length > 0 ? (
          posts
            .filter(post => {
              const username = users[post.user_id]?.toLowerCase() || ""
              return username.includes(searchTerm.toLowerCase())
            })
            .map((post) => (
              <div key={post.id} className={styles["post-card"]}>
                <div className={styles["post-header"]}>
                  <div className={styles["post-info"]}>
                    <span className={styles["post-id"]}>ID: {post.id}</span>
                    <span className={styles["post-author"]}>
                      Por: {users[post.user_id] || `Usuario ${post.user_id}`}
                    </span>
                    <span className={styles["post-date"]}>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles["post-stats"]}>
                    {post.image && <span className={styles["has-image"]}>📷 Con imagen</span>}
                  </div>
                </div>

                <div className={styles["post-content"]}>
                  <p>{truncateContent(post.content)}</p>
                  {post.image && (
                    <div className={styles["post-image"]}>
                      <img
                        src={`${post.image}`}
                        alt="Post"
                        style={{ maxWidth: "200px", maxHeight: "200px" }}
                      />
                    </div>
                  )}
                </div>

                <div className={styles["post-actions"]}>
                  <button
                    className={`${styles["action-btn"]} ${styles.delete}`}
                    onClick={() => deletePost(post.id)}
                  >
                    Eliminar Publicación
                  </button>
                </div>
              </div>
            ))
        ) : (
          <div className="no-data">
            <p>No hay publicaciones para mostrar.</p>
          </div>
        )}
      </div>

      <div className={styles.pagination}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
          Anterior
        </button>
        <span>
          Página {currentPage} de {pagination?.pages || 1}
        </span>
        <button
          disabled={currentPage === (pagination?.pages || 1)}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

export default AdminPosts
