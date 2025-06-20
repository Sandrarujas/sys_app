import { useContext } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext)

  if (loading) return <div>Cargando...</div>

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}

export default PublicRoute
