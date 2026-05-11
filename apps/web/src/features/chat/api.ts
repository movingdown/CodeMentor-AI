import { apiClient, API_BASE_URL } from "@/lib/apiClient"
import { useAuthStore } from "@/features/auth/store"
import type { Chat, ChatDetail, Message, StreamEvent } from "./types"

export async function listChats(): Promise<Chat[]> {
  const { data } = await apiClient.get<Chat[]>("/chats")
  return data
}

export async function createChat(title?: string): Promise<Chat> {
  const { data } = await apiClient.post<Chat>("/chats", { title })
  return data
}

export async function getChat(id: string): Promise<ChatDetail> {
  const { data } = await apiClient.get<ChatDetail>(`/chats/${id}`)
  return data
}

export async function listMessages(chatId: string): Promise<Message[]> {
  const { data } = await apiClient.get<Message[]>(`/chats/${chatId}/messages`)
  return data
}

export async function deleteChat(id: string): Promise<void> {
  await apiClient.delete(`/chats/${id}`)
}

/**
 * SSE async generator. fetch + ReadableStream으로 직접 파싱.
 * EventSource는 POST·Authorization 미지원이라 fetch로 대체.
 */
export async function* streamMessage(
  chatId: string,
  content: string
): AsyncGenerator<StreamEvent> {
  const token = useAuthStore.getState().token

  const res = await fetch(
    `${API_BASE_URL}/api/v1/chats/${chatId}/messages/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
    }
  )

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "")
    throw new Error(`Stream failed: ${res.status} ${text}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const chunks = buffer.split("\n\n")
      buffer = chunks.pop() ?? ""

      for (const chunk of chunks) {
        const line = chunk.trim()
        if (!line.startsWith("data:")) continue
        const json = line.slice(5).trim()
        if (!json) continue
        try {
          yield JSON.parse(json) as StreamEvent
        } catch (e) {
          console.warn("Failed to parse SSE chunk:", json, e)
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
