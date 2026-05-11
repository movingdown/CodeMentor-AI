import { useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { createChat } from "@/features/chat/api"
import { ChatComposer } from "@/features/chat/components/ChatComposer"
import { ChatMessage } from "@/features/chat/components/ChatMessage"
import { ChatSidebar } from "@/features/chat/components/ChatSidebar"
import { EmptyState } from "@/features/chat/components/EmptyState"
import { StreamingMessage } from "@/features/chat/components/StreamingMessage"
import {
  mergeWithOptimistic,
  useMessages,
  useStreamChat,
} from "@/features/chat/hooks"

export function ChatPage() {
  const { chatId } = useParams<{ chatId?: string }>()
  const navigate = useNavigate()
  const { data: messages = [], isLoading } = useMessages(chatId ?? null)
  const { send, streamingContent, optimisticUser, isStreaming } = useStreamChat()

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior: isStreaming ? "auto" : "smooth",
    })
  }, [messages, streamingContent, optimisticUser, isStreaming])

  const handleSend = async (content: string) => {
    let targetId = chatId
    if (!targetId) {
      try {
        const chat = await createChat()
        targetId = chat.id
        navigate(`/chat/${chat.id}`, { replace: true })
      } catch {
        toast.error("새 채팅을 시작하지 못했어요.")
        return
      }
    }
    await send(targetId, content)
  }

  const allMessages = mergeWithOptimistic(
    messages,
    optimisticUser,
    streamingContent,
    isStreaming
  )

  return (
    <div className="h-full flex">
      <ChatSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-auto">
          {!chatId && allMessages.length === 0 ? (
            <EmptyState onSuggestionClick={(t) => handleSend(t)} />
          ) : isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              불러오는 중...
            </div>
          ) : allMessages.length === 0 ? (
            <EmptyState onSuggestionClick={(t) => handleSend(t)} />
          ) : (
            <div className="max-w-3xl mx-auto py-2">
              {allMessages.map((m) =>
                m.id === "optimistic-assistant" ? (
                  <StreamingMessage
                    key={m.id}
                    content={m.content}
                    isStreaming={isStreaming}
                  />
                ) : (
                  <ChatMessage key={m.id} role={m.role} content={m.content} />
                )
              )}
            </div>
          )}
        </div>

        <ChatComposer
          onSend={handleSend}
          disabled={isStreaming}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  )
}
