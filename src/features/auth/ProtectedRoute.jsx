import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

/** Renders `children` only for a signed-in admin; everyone else goes to the login page. */
export default function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
