"use client"

import { createContext, useState, useEffect, useCallback, useContext } from "react"
import axiosInstance from "../api/axiosInstance"


export const AuthContext = createContext()

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
      const res = await axiosInstance.get(`/api/notifications?limit=${limit}`)
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
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`
        const res = await axiosInstance.get("/api/auth/me")
        setUser(res.data)
      } catch {
        localStorage.removeItem("token")
        delete axiosInstance.defaults.headers.common["Authorization"]
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
      const res = await axiosInstance.post("/api/auth/login", { email, password })
      const { token, user: userData } = res.data

      localStorage.setItem("token", token)
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(userData)
      return true
    } catch {
      return false
    }
  }

  const register = async (username, email, password) => {
    try {
      const res = await axiosInstance.post("/api/auth/register", { username, email, password })
      const { token, user: userData } = res.data

      localStorage.setItem("token", token)
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(userData)
      return true
    } catch {
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete axiosInstance.defaults.headers.common["Authorization"]
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
      const res = await axiosInstance.get("/api/auth/me")
      setUser(res.data)
      return res.data
    } catch (error) {
      console.error("Error refreshing user:", error)
    }
  }

  const markNotificationAsRead = async (id) => {
    try {
      await axiosInstance.put(`/api/notifications/${id}/read`)
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount((prev) => Math.max(prev - 1, 0))
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error)
    }
  }

  const markAllNotificationsAsRead = async () => {
    try {
      await axiosInstance.put("/api/notifications/read-all")
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error)
    }
  }

  const updatePost = (postId, updatedData) => {
    setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, ...updatedData } : post))
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
    setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, liked, likes } : post))
  }

  const updatePostComments = (postId, commentCount) => {
    setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, commentCount } : post))
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
