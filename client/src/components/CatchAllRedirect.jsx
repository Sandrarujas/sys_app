import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const CatchAllRedirect = () => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div>Cargando...</div>

  if (!user) return <Navigate to="/login" replace />

  return <Navigate to="/" state={{ from: location }} replace />
}

export default CatchAllRedirect
