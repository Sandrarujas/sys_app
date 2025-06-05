"use client"

import { createContext, useState, useEffect, useCallback, useContext } from "react"
import axios from "axios"

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
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifications?limit=${limit}`)
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
            try {
                const token = localStorage.getItem("token")
                if (token) {
                    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
                    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`)
                    setUser(res.data)
                }
            } catch (error) {
                localStorage.removeItem("token")
                delete axios.defaults.headers.common["Authorization"]
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        checkLoggedIn()
    }, [])

    useEffect(() => {
        if (user) fetchNotifications()
    }, [user, fetchNotifications])

    useEffect(() => {
        if (!user) return
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [user, fetchNotifications])

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, { email, password })
            localStorage.setItem("token", res.data.token)
            axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`
            setUser(res.data.user)
            return true
        } catch (error) {
            return false
        }
    }

    const register = async (username, email, password) => {
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
                username, email, password
            })
            localStorage.setItem("token", res.data.token)
            axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`
            setUser(res.data.user)
            return true
        } catch (error) {
            return false
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
        setUser(prev => ({ ...prev, ...updatedData }))
    }

    const refreshUser = async () => {
        try {
            const token = localStorage.getItem("token")
            if (token) {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`)
                setUser(res.data)
                return res.data
            }
        } catch (error) {
            console.error("Error refreshing user:", error)
        }
    }

    const markNotificationAsRead = async (id) => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/notifications/${id}/read`)
            setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif)))
            setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0))
        } catch (error) {
            console.error("Error al marcar notificación:", error)
        }
    }

    const markAllNotificationsAsRead = async () => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/notifications/read-all`)
            setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error("Error al marcar todas las notificaciones:", error)
        }
    }

    const updatePost = (postId, updatedData) => {
        setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, ...updatedData } : post)))
    }

    const deletePost = (postId) => {
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId))
    }

    const addPost = (newPost) => {
        setPosts((prevPosts) => [newPost, ...prevPosts])
    }

    const setAllPosts = (newPosts) => {
        setPosts(newPosts)
    }

    const updatePostLikes = (postId, liked, likesCount) => {
        setPosts((prevPosts) =>
            prevPosts.map((post) => (post.id === postId ? { ...post, liked, likes: likesCount } : post))
        )
    }

    const updatePostComments = (postId, commentCount) => {
        setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, commentCount } : post)))
    }

    const isAdmin = () => {
        return user?.role === "admin"
    }

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
