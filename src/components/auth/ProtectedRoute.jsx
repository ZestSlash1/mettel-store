import { Navigate, useLocation } from 'react-router-dom'
import { useFirebaseAuth } from '../../context/FirebaseAuthContext'

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useFirebaseAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full bg-silver-200" />
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}
