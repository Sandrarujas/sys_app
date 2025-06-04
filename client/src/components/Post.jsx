"use client"

import { useState, useEffect, useContext } from "react"
import axios from "axios"
import { useAuth } from "../context/AuthContext"
import { AuthContext } from "../context/AuthContext"
import Post from "../components/Post"
import styles from "../styles/Home.module.css" // ⬅️ Importamos el módulo CSS

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"  // Pon URL por defecto

const Home = () => {
  const { updatePost, deletePost: deletePostFromContext } = useContext(AuthContext)
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        console.log("BASE_URL:", BASE_URL)
        const res = await axios.get(`${BASE_URL}/api/posts?page=${page}&limit=5`)
        console.log("API response data:", res.data)
        setPosts(res.data.posts || [])
        setPagination(res.data.pagination || {
          page: 1,
          limit: 5,
          total: 0,
          totalPages: 0,
        })
        setLoading(false)
      } catch (error) {
        console.error("Error fetching posts:", error)
        setError("Error al cargar las publicaciones")
        setLoading(false)
      }
    }

    fetchPosts()
  }, [page])

  const handlePostUpdate = (updatedPost) => {
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post)))
    updatePost(updatedPost.id, updatedPost)
  }

  const handlePostDelete = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId))
    deletePostFromContext(postId)
    setPagination((prev) => ({
      ...prev,
      total: prev.total - 1,
    }))
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < pagination.totalPages) {
      setPage(page + 1)
    }
  }

  if (loading && page === 1) {
    return <div className={styles.loading}>Cargando publicaciones...</div>
  }

  if (error) {
    return <div className={styles.error}>{error}</div>
  }

  return (
    <div className={styles["home-container"]}>
      <h1>
        <p>Bienvenido, {user?.username}</p>¿Que hay de nuevo?
      </h1>
      <div className={styles["posts-container"]}>
        {Array.isArray(posts) && posts.length > 0 ? (
          posts.map((post) => (
            <Post key={post.id} post={post} onPostUpdate={handlePostUpdate} onPostDelete={handlePostDelete} />
          ))
        ) : (
          <p>No hay publicaciones disponibles. ¡Sigue a más usuarios o crea tu primera publicación!</p>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles["pagination-button"]} onClick={handlePrevPage} disabled={page === 1 || loading}>
            Anterior
          </button>
          <div className={styles["pagination-info"]}>
            Página {page} de {pagination.totalPages}
          </div>
          <button
            className={styles["pagination-button"]}
            onClick={handleNextPage}
            disabled={page === pagination.totalPages || loading}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}

export default Home
