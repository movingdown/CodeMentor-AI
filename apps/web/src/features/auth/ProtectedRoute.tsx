import { Loader2 } from "lucide-react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useMe } from "./hooks"
import { useAuthStore } from "./store"

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()
  const { isLoading, isError } = useMe()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
