import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { StatusBar } from "./StatusBar"
import { Topbar } from "./Topbar"

export function AppLayout() {
  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 min-h-0 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
      <StatusBar />
    </div>
  )
}
