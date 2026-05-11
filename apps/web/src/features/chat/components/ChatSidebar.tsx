import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, MessageSquare, Plus, Trash2 } from "lucide-react"
import { NavLink, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createChat, deleteChat } from "../api"
import { useChats } from "../hooks"

export function ChatSidebar() {
  const navigate = useNavigate()
  const { chatId } = useParams<{ chatId?: string }>()
  const qc = useQueryClient()
  const { data: chats, isLoading } = useChats()

  const createMutation = useMutation({
    mutationFn: () => createChat(),
    onSuccess: (chat) => {
      qc.invalidateQueries({ queryKey: ["chats"] })
      navigate(`/chat/${chat.id}`)
    },
    onError: () => toast.error("새 채팅을 만들지 못했어요."),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteChat(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["chats"] })
      if (chatId === id) navigate("/chat", { replace: true })
    },
  })

  return (
    <aside className="w-64 shrink-0 border-r border-border/40 bg-card/20 flex flex-col">
      <div className="p-3 border-b border-border/40">
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="w-full justify-start gap-2 h-9"
          variant="outline"
        >
          {createMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          <span className="text-sm">새 채팅</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-0.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : chats && chats.length > 0 ? (
          chats.map((chat) => (
            <div key={chat.id} className="group relative">
              <NavLink
                to={`/chat/${chat.id}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-blue-500/15 text-blue-300"
                      : "text-foreground/80 hover:bg-muted/40"
                  )
                }
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate flex-1">{chat.title}</span>
              </NavLink>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (confirm("이 채팅을 삭제할까요?")) deleteMutation.mutate(chat.id)
                }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="삭제"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        ) : (
          <div className="px-3 py-6 text-xs text-muted-foreground text-center">
            아직 채팅이 없어요.
          </div>
        )}
      </div>
    </aside>
  )
}
