export type Role = "user" | "assistant" | "system"

export type Message = {
  id: string
  role: Role
  content: string
  created_at: string
}

export type Chat = {
  id: string
  title: string
  model: string
  created_at: string
  updated_at: string
}

export type ChatDetail = Chat & {
  messages: Message[]
}

export type StreamEvent =
  | { type: "user_saved"; id: string }
  | { type: "token"; text: string }
  | { type: "done"; message_id: string; chat_id: string }
  | { type: "error"; message: string }
