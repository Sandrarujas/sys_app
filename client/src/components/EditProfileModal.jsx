"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import styles from "../styles/EditProfileModal.module.css"


const BASE_URL = "http://localhost:5000"

const EditProfileModal = ({ isOpen, onClose, profile, onProfileUpdate }) => {
  const [bio, setBio] = useState("")
  const [profileImage, setProfileImage] = useState(null)
  const [previewImage, setPreviewImage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "")
      setPreviewImage(profile.profileImage ? `${BASE_URL}${profile.profileImage}` : "")
    }
  }, [profile])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfileImage(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const bioResponse = await axios.put(`${BASE_URL}/api/users/bio`, { bio })

      let imageResponse = null
      if (profileImage) {
        const formData = new FormData()
        formData.append("profileImage", profileImage)
        imageResponse = await axios.put(`${BASE_URL}/api/users/profile-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      }

      onProfileUpdate({
        bio: bioResponse.data.bio,
        profileImage: imageResponse ? imageResponse.data.profileImage : profile.profileImage,
      })

      onClose()
    } catch (error) {
      console.error("Error al actualizar perfil:", error)
      setError("Error al actualizar el perfil. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.editProfileModal}>
        <div className={styles.modalHeader}>
          <h2>Editar Perfil</h2>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.profileImageUpload}>
            <label>Foto de Perfil</label>
            <img
              src={previewImage || "/placeholder.svg?height=150&width=150"}
              alt="Vista previa"
              className={styles.previewImage}
            />
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>

          <div>
            <label>Biografía</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Escribe algo sobre ti..."
              rows={4}
              maxLength={500}
            />
            <small>{bio.length}/500 caracteres</small>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton} disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProfileModal
