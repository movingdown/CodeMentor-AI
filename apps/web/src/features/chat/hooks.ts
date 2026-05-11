import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import {
  createChat as apiCreateChat,
  deleteChat as apiDeleteChat,
  listChats,
  listMessages,
  streamMessage,
} from "./api"
import type { Message } from "./types"

export function useChats() {
  return useQuery({
    queryKey: ["chats"],
    queryFn: listChats,
    staleTime: 30_000,
  })
}

export function useMessages(chatId: string | null) {
  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => listMessages(chatId!),
    enabled: !!chatId,
    staleTime: 30_000,
  })
}

export function useCreateChat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title?: string) => apiCreateChat(title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chats"] }),
  })
}

export function useDeleteChat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDeleteChat(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chats"] }),
  })
}

/**
 * SSE streaming + optimistic UI.
 */
export function useStreamChat() {
  const qc = useQueryClient()
  const [streamingContent, setStreamingContent] = useState("")
  const [optimisticUser, setOptimisticUser] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const send = useCallback(
    async (chatId: string, content: string) => {
      setOptimisticUser(content)
      setStreamingContent("")
      setIsStreaming(true)

      try {
        for await (const event of streamMessage(chatId, content)) {
          if (event.type === "token") {
            setStreamingContent((prev) => prev + event.text)
          } else if (event.type === "done") {
            await qc.refetchQueries({ queryKey: ["messages", chatId] })
            qc.invalidateQueries({ queryKey: ["chats"] })
          } else if (event.type === "error") {
            toast.error(event.message)
          }
        }
      } catch (e) {
        console.error(e)
        toast.error("스트리밍 연결이 끊겼어요.")
      } finally {
        setOptimisticUser(null)
        setStreamingContent("")
        setIsStreaming(false)
      }
    },
    [qc]
  )

  return { send, streamingContent, optimisticUser, isStreaming }
}

export function mergeWithOptimistic(
  messages: Message[],
  optimisticUser: string | null,
  streamingContent: string,
  isStreaming: boolean
): Message[] {
  const result: Message[] = [...messages]
  if (optimisticUser) {
    result.push({
      id: "optimistic-user",
      role: "user",
      content: optimisticUser,
      created_at: new Date().toISOString(),
    })
  }
  if (isStreaming) {
    result.push({
      id: "optimistic-assistant",
      role: "assistant",
      content: streamingContent,
      created_at: new Date().toISOString(),
    })
  }
  return result
}
