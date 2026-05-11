import { useQueryClient } from "@tanstack/react-query"
import {
  Bot,
  FolderGit2,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { useMe } from "@/features/auth/hooks"
import { useAuthStore } from "@/features/auth/store"
import { cn } from "@/lib/utils"

type NavItem = {
  to: string
  icon: LucideIcon
  label: string
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/chat", icon: MessageSquare, label: "Chat" },
  { to: "/projects", icon: FolderGit2, label: "Projects" },
  { to: "/settings", icon: Settings, label: "Settings", disabled: true },
]

export function Sidebar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clear = useAuthStore((s) => s.clear)
  const { data: user } = useMe()

  const handleLogout = () => {
    clear()
    queryClient.removeQueries({ queryKey: ["me"] })
    navigate("/login", { replace: true })
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border/40 bg-card/30 flex flex-col">
      <div className="px-4 py-4 border-b border-border/40 flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="font-semibold text-sm tracking-tight">
          CodeMentor <span className="text-blue-400">AI</span>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label, disabled }) =>
          disabled ? (
            <div
              key={to}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground/50 cursor-not-allowed select-none"
              title="개발 예정"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
                soon
              </span>
            </div>
          ) : (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-blue-500/15 text-blue-300"
                    : "text-foreground/80 hover:bg-muted/50 hover:text-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          )
        )}
      </nav>

      <div className="border-t border-border/40 p-3 space-y-2">
        <div className="px-1 text-xs">
          <div className="font-medium truncate">{user?.display_name ?? "—"}</div>
          <div className="text-muted-foreground truncate">{user?.email ?? ""}</div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground/80 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  )
}
