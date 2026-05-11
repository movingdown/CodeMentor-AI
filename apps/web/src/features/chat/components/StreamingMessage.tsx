import { Bot } from "lucide-react"
import { MarkdownRenderer } from "./MarkdownRenderer"

type Props = {
  content: string
  isStreaming: boolean
}

export function StreamingMessage({ content, isStreaming }: Props) {
  return (
    <div className="flex gap-3 px-4 py-4 bg-card/30">
      <div className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center mt-0.5 bg-gradient-to-br from-blue-500 to-violet-500 shadow-lg shadow-blue-500/20">
        <Bot className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1 font-medium">
          CodeMentor
        </div>
        {content ? (
          <div className="text-sm">
            <MarkdownRenderer content={content + (isStreaming ? "▌" : "")} />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:300ms]" />
          </div>
        )}
      </div>
    </div>
  )
}
