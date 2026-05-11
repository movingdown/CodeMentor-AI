import { motion } from "framer-motion"
import { Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { MarkdownRenderer } from "./MarkdownRenderer"

type Props = {
  role: "user" | "assistant" | "system"
  content: string
}

export function ChatMessage({ role, content }: Props) {
  const isUser = role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex gap-3 px-4 py-4",
        isUser ? "bg-transparent" : "bg-card/30"
      )}
    >
      <div
        className={cn(
          "h-7 w-7 shrink-0 rounded-md flex items-center justify-center mt-0.5",
          isUser
            ? "bg-muted/60"
            : "bg-gradient-to-br from-blue-500 to-violet-500 shadow-lg shadow-blue-500/20"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-foreground/80" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1 font-medium">
          {isUser ? "You" : "CodeMentor"}
        </div>
        {isUser ? (
          <div className="whitespace-pre-wrap text-sm leading-7 break-words">
            {content}
          </div>
        ) : (
          <div className="text-sm">
            <MarkdownRenderer content={content} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
