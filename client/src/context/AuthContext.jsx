"use client"
import { createContext, useState, useEffect, useCallback, useContext } from "react"
import axios from "axios"

export const AuthContext = createContext()

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  const [posts, setPosts] = useState([])

  const fetchNotifications = useCallback(async (limit = 5) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      setNotificationsLoading(true)
      // axiosInstance ya tiene baseURL, solo pasamos endpoint
      const res = await axios.get(`${BASE_URL}/api/notifications?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unreadCount)
    } catch (error) {
      console.error("Error al cargar notificaciones:", error)
    } finally {
      setNotificationsLoading(false)
    }
  }, [])

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        setLoading(false)
        return
      }

      try {
        // Establecer el token en los headers por defecto de axiosInstance
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
        const res = await axios.get(`${BASE_URL}/api/auth/me`)
        setUser(res.data)
      } catch {
        localStorage.removeItem("token")
        delete axios.defaults.headers.common["Authorization"]
      } finally {
        setLoading(false)
      }
    }

    checkLoggedIn()
  }, [])

  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user, fetchNotifications])

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, { email, password })
      const { token, user: userData } = res.data

      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(userData)

      return { success: true }
    } catch (error) {
      console.error("Error de login:", error.response?.data || error.message)
      const message =
        error.response?.data?.message ||
        error.message ||
        "Error al iniciar sesión"

      return { success: false, message }
    }
  }

 const register = async (username, email, password) => {
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/register`, {
      username,
      email,
      password,
      role: "user",
    })

    localStorage.setItem("token", res.data.token)
    axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`

    setUser({
      id: res.data.user.id,
      username: res.data.user.username,
      email: res.data.user.email,
      role: res.data.user.role,
    })

    return { success: true }
  } catch (error) {
    console.error("Error en registro:", error.response?.data || error.message)
    const message =
      error.response?.data?.message ||
      error.message ||
      "Error al registrarse"

    const conflictingField = error.response?.data?.conflictingField

    return { success: false, message, conflictingField }
  }
}

  const logout = () => {
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
    setNotifications([])
    setUnreadCount(0)
    setPosts([])
  }

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }))
  }

  const refreshUser = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/auth/me`)
      setUser(res.data)
      return res.data
    } catch (error) {
      console.error("Error refreshing user:", error)
    }
  }

  const markNotificationAsRead = async (id) => {
    try {
      await axios.put(`${BASE_URL}/api/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(prev - 1, 0))
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error)
    }
  }

  const markAllNotificationsAsRead = async () => {
    try {
      await axios.put(`${BASE_URL}/api/notifications/read-all`)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error)
    }
  }

  const updatePost = (postId, updatedData) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, ...updatedData } : post))
    )
  }

  const deletePost = (postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  const addPost = (newPost) => {
    setPosts((prev) => [newPost, ...prev])
  }

  const setAllPosts = (newPosts) => {
    setPosts(newPosts)
  }

  const updatePostLikes = (postId, liked, likes) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, liked, likes } : post
      )
    )
  }

  const updatePostComments = (postId, commentCount) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, commentCount } : post))
    )
  }

  const isAdmin = () => user?.role === "admin"

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        notifications,
        unreadCount,
        notificationsLoading,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        posts,
        updatePost,
        deletePost,
        addPost,
        setAllPosts,
        updatePostLikes,
        updatePostComments,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export default AuthContext
