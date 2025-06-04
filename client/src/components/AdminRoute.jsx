"use client"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />
  }

  return children
}

export default AdminRoute
