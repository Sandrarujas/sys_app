"use client"

import { useState, useContext } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { AuthContext } from "../context/AuthContext"
import CommentList from "./CommentList"
import EditPostModal from "./EditPostModal"
import styles from "../styles/Post.module.css" 

const Post = ({ post, onPostUpdate, onPostDelete }) => {
  // ✅ Usar AuthContext para todo
  const {
    user,
    updatePost,
    deletePost: deletePostFromContext,
    updatePostLikes,
    updatePostComments,
  } = useContext(AuthContext)

  const [likes, setLikes] = useState(post.likes || 0)
  const [liked, setLiked] = useState(post.liked || false)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState(post.comments || [])
  const [commentCount, setCommentCount] = useState(post.commentCount || post.comments?.length || 0)
  const [loadingComments, setLoadingComments] = useState(false)
  const [allCommentsLoaded, setAllCommentsLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const isOwner = user && post.user && user.id === post.user.id

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith("http")) return imagePath
    return `http://localhost:5000${imagePath}`
  }

  const handleLike = async () => {
    try {
      await axios.post(`http://localhost:5000/api/posts/${post.id}/like`)
      const newLiked = !liked
      const newLikes = liked ? likes - 1 : likes + 1

      // ✅ Actualizar estado local inmediatamente
      setLiked(newLiked)
      setLikes(newLikes)

      // ✅ Actualizar contexto global
      updatePostLikes(post.id, newLiked, newLikes)
    } catch (error) {
      console.error("Error liking post:", error)
      // Revertir cambios en caso de error
      setLiked(liked)
      setLikes(likes)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    try {
      const res = await axios.post(`http://localhost:5000/api/posts/${post.id}/comment`, {
        content: commentText,
      })

      const newCommentCount = commentCount + 1

      // ✅ Actualizar estado local
      setComments([res.data, ...comments])
      setCommentCount(newCommentCount)
      setCommentText("")

      // ✅ Actualizar contexto global
      updatePostComments(post.id, newCommentCount)
    } catch (error) {
      console.error("Error commenting on post:", error)
    }
  }

  const toggleComments = async () => {
    setShowComments(!showComments)

    if (showComments) return

    if (comments.length === 0 && !showComments) {
      try {
        setLoadingComments(true)
        const res = await axios.get(`http://localhost:5000/api/posts/${post.id}/comments?limit=5`)
        setComments(res.data.comments)
        setAllCommentsLoaded(res.data.comments.length >= res.data.pagination.total)
        setLoadingComments(false)
      } catch (error) {
        console.error("Error loading comments:", error)
        setLoadingComments(false)
      }
    }
  }

  const loadMoreComments = async () => {
    try {
      setLoadingComments(true)
      const page = Math.floor(comments.length / 5) + 1
      const res = await axios.get(`http://localhost:5000/api/posts/${post.id}/comments?page=${page}&limit=5`)

      setComments([...comments, ...res.data.comments])
      setAllCommentsLoaded(comments.length + res.data.comments.length >= res.data.pagination.total)
      setLoadingComments(false)
    } catch (error) {
      console.error("Error loading more comments:", error)
      setLoadingComments(false)
    }
  }

  const handleImageError = () => {
    console.error("Error al cargar la imagen:", post.image)
    setImageError(true)
  }

  const handleEditPost = () => {
    setIsEditModalOpen(true)
    setShowOptions(false)
  }

  const handleDeletePost = async () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta publicación?")) {
      try {
        setIsDeleting(true)
        await axios.delete(`http://localhost:5000/api/posts/${post.id}`)

        // ✅ Actualizar contexto global inmediatamente
        deletePostFromContext(post.id)

        // ✅ Notificar al componente padre
        if (onPostDelete) {
          onPostDelete(post.id)
        }
      } catch (error) {
        console.error("Error al eliminar publicación:", error)
        alert("Error al eliminar la publicación")
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handlePostUpdate = (updatedPost) => {
    // ✅ Actualizar estado local
    setImageError(false)

    // ✅ Actualizar contexto global
    updatePost(post.id, updatedPost)

    // ✅ Notificar al componente padre
    if (onPostUpdate) {
      onPostUpdate(updatedPost)
    }
  }

  const toggleOptions = () => {
    setShowOptions(!showOptions)
  }

  return (
    <div className={styles.post}>
      <div className={styles["post-header"]}>
        <Link to={`/profile/${post.user.username}`} className={styles["post-user"]}>
          <img
            src={getImageUrl(post.user.profileImage) || "/placeholder.svg?height=40&width=40"}
            alt={post.user.username}
            className={styles["post-user-image"]}
            onError={(e) => {
              e.target.src = "/placeholder.svg?height=40&width=40"
            }}
          />
          <span className={styles["post-username"]}>{post.user.username}</span>
        </Link>
        <div className={styles["post-header-right"]}>
          <span className={styles["post-date"]}>{new Date(post.createdAt).toLocaleDateString()}</span>

          {isOwner && (
            <div className={styles["post-options"]}>
              <button className={styles["post-options-button"]} onClick={toggleOptions}>
                ⋮
              </button>
              {showOptions && (
                <div className={styles["post-options-menu"]}>
                  <button onClick={handleEditPost} disabled={isDeleting}>
                    Editar
                  </button>
                  <button onClick={handleDeletePost} disabled={isDeleting}>
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className={styles["post-content"]}>
        <p>{post.content}</p>
        {post.image && !imageError && (
          <div className={styles["post-image-container"]}>
            <img
              src={getImageUrl(post.image) || "/placeholder.svg"}
              alt="Post"
              className={styles["post-image"]}
              onError={handleImageError}
            />
          </div>
        )}
        {imageError && (
          <div className={styles["post-image-error"]}>
            <p>No se pudo cargar la imagen</p>
            <p className={styles["post-image-path"]}>Ruta: {post.image}</p>
          </div>
        )}
      </div>
      <div className={styles["post-actions"]}>
        <button className={`${styles["post-like-button"]} ${liked ? styles.liked : ""}`} onClick={handleLike}>
          {liked ? "❤️" : "🤍"} {likes}
        </button>
        <button className={styles["post-comment-button"]} onClick={toggleComments}>
          💬 {commentCount}
        </button>
      </div>
      {showComments && (
        <div className={styles["post-comments"]}>
          <form onSubmit={handleComment} className={styles["comment-form"]}>
            <input
              type="text"
              placeholder="Escribe un comentario..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className={styles["comment-input"]}
            />
            <button type="submit" className={styles["comment-submit"]}>
              Enviar
            </button>
          </form>

          {loadingComments && comments.length === 0 ? (
            <div className={styles.loading}>Cargando comentarios...</div>
          ) : (
            <>
              <CommentList comments={comments} />

              {!allCommentsLoaded && commentCount > comments.length && (
                <div className={styles["view-all-comments"]}>
                  <button className={styles["view-all-comments-button"]} onClick={loadMoreComments} disabled={loadingComments}>
                    {loadingComments
                      ? "Cargando..."
                      : `Ver más comentarios (${commentCount - comments.length} restantes)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {isEditModalOpen && (
        <EditPostModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          post={post}
          onPostUpdate={handlePostUpdate}
        />
      )}
    </div>
  )
}

export default Post
