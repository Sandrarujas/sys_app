"use client"

import { useState, useEffect } from "react"
import { useLocation, Link } from "react-router-dom"
import axios from "axios"
import Post from "../components/Post"

const Search = () => {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const query = searchParams.get("q") || ""

  const [activeTab, setActiveTab] = useState("users")
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      try {
        if (activeTab === "users") {
          const res = await axios.get(`/api/search/users?q=${query}`)
          setUsers(res.data)
        } else {
          const res = await axios.get(`/api/search/posts?q=${query}`)
          setPosts(res.data)
        }
        setLoading(false)
      } catch (error) {
        console.error("Error en búsqueda:", error)
        setError("Error al realizar la búsqueda")
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [query, activeTab])

  const handleFollow = async (userId, isFollowing, index) => {
    try {
      if (isFollowing) {
        await axios.delete(`/api/users/${userId}/unfollow`)
      } else {
        await axios.post(`/api/users/${userId}/follow`)
      }

      // Actualizar estado local
      const updatedUsers = [...users]
      updatedUsers[index].isFollowing = !isFollowing
      setUsers(updatedUsers)
    } catch (error) {
      console.error("Error al seguir/dejar de seguir:", error)
    }
  }

  return (
    <div className="search-container">
      <h1>Resultados de búsqueda: "{query}"</h1>

      <div className="search-tabs">
        <button className={`tab-button ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
          Usuarios
        </button>
        <button className={`tab-button ${activeTab === "posts" ? "active" : ""}`} onClick={() => setActiveTab("posts")}>
          Publicaciones
        </button>
      </div>

      {loading ? (
        <div className="loading">Buscando...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : activeTab === "users" ? (
        <div className="users-results">
          {users.length > 0 ? (
            users.map((user, index) => (
              <div key={user.id} className="user-card">
                <Link to={`/profile/${user.username}`} className="user-info">
                  <img
                    src={user.profileImage ? `${user.profileImage}` : "/placeholder.svg?height=50&width=50"}
                    alt={user.username}
                    className="user-image"
                  />
                  <div className="user-details">
                    <h3 className="user-username">{user.username}</h3>
                    <p className="user-bio">{user.bio || "Sin biografía"}</p>
                  </div>
                </Link>
                <button
                  className={`follow-button ${user.isFollowing ? "following" : ""}`}
                  onClick={() => handleFollow(user.id, user.isFollowing, index)}
                >
                  {user.isFollowing ? "Dejar de Seguir" : "Seguir"}
                </button>
              </div>
            ))
          ) : (
            <p className="no-results">No se encontraron usuarios con "{query}"</p>
          )}
        </div>
      ) : (
        <div className="posts-results">
          {posts.length > 0 ? (
            posts.map((post) => <Post key={post.id} post={post} />)
          ) : (
            <p className="no-results">No se encontraron publicaciones con "{query}"</p>
          )}
        </div>
      )}
    </div>
  )
}

export default Search
