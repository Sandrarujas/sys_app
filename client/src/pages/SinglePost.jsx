"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import Post from "../components/Post"
import styles from "../styles/Post.module.css"

const BASE_URL = process.env.REACT_APP_API_URL;

const SinglePost = () => {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${BASE_URL}/api/posts/${id}`)
        setPost(res.data)
        setLoading(false)
      } catch (error) {
        console.error("Error al cargar la publicación:", error)
        setError("No se pudo cargar la publicación. Puede que haya sido eliminada o no tengas permiso para verla.")
        setLoading(false)
      }
    }

    fetchPost()
  }, [id])

  const handleBack = () => {
    navigate(-1)
  }

  if (loading) {
    return <div className="loading">Cargando publicación...</div>
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button className="back-button" onClick={handleBack}>
          Volver
        </button>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="error-container">
        <div className="error">Publicación no encontrada</div>
        <button className="back-button" onClick={handleBack}>
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className={styles["single-post-container"]}>
      <div className={styles["single-post-header"]}>
        <button className="back-button" onClick={handleBack}>
          ← Volver
        </button>
        <h1>Publicación</h1>
      </div>
      <Post post={post} />
    </div>
  )
}

export default SinglePost
