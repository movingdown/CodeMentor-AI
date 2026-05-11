import { createBrowserRouter } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/features/auth/ProtectedRoute"
import { ChatPage } from "./routes/ChatPage"
import { DashboardPage } from "./routes/DashboardPage"
import { LandingPage } from "./routes/LandingPage"
import { LoginPage } from "./routes/LoginPage"
import { ProjectDetailPage } from "./routes/ProjectDetailPage"
import { ProjectsPage } from "./routes/ProjectsPage"
import { SignupPage } from "./routes/SignupPage"

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/chat", element: <ChatPage /> },
          { path: "/chat/:chatId", element: <ChatPage /> },
          { path: "/projects", element: <ProjectsPage /> },
          { path: "/projects/:projectId", element: <ProjectDetailPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <LandingPage /> },
])
