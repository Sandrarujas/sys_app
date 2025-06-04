"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import styles from "../styles/CreatePost.module.css" // Importamos el módulo CSS

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState("")
  const [image, setImage] = useState(null)
  const [previewImage, setPreviewImage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let timer
    if (success) {
      timer = setTimeout(() => {
        setSuccess(false)
      }, 3000)
    }
    return () => clearTimeout(timer)
  }, [success])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!content && !image) {
      setError("La publicación debe tener contenido o imagen")
      return
    }

    try {
      setLoading(true)
      setError("")

      const formData = new FormData()
      formData.append("content", content)
      if (image) formData.append("image", image)

      const res = await axios.post("/api/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      setContent("")
      setImage(null)
      setPreviewImage("")
      setSuccess(true)

      if (onPostCreated) onPostCreated(res.data)
    } catch (error) {
      console.error("Error al crear publicación:", error)
      setError(error.response?.data?.message || "Error al crear la publicación")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles["create-post-container"]}>
      <h2>Crear Publicación</h2>
      {error && <div className={styles["create-post-error"]}>{error}</div>}
      {success && <div className={styles["create-post-success"]}>¡Publicación creada con éxito!</div>}
      <form onSubmit={handleSubmit} className={styles["create-post-form"]}>
        <div className={styles["form-group"]}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="¿Qué estás pensando?"
            rows={3}
          />
        </div>
        <div className={styles["form-group"]}>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {previewImage && (
            <div className={styles["image-preview"]}>
              <img src={previewImage} alt="Vista previa" />
            </div>
          )}
        </div>
        <button
          type="submit"
          className={styles["create-post-button"]}
          disabled={loading}
        >
          {loading ? "Publicando..." : "Publicar"}
        </button>
      </form>
    </div>
  )
}

export default CreatePost
