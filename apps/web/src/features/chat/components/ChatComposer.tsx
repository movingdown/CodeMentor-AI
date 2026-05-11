import { ArrowUp, Loader2 } from "lucide-react"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"

type Props = {
  onSend: (content: string) => void
  disabled?: boolean
  isStreaming?: boolean
}

export function ChatComposer({ onSend, disabled, isStreaming }: Props) {
  const [value, setValue] = useState("")
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue("")
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="px-4 py-3 border-t border-border/40 bg-background/80 backdrop-blur">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 rounded-xl border border-border/60 bg-card/60 p-2 focus-within:border-blue-500/60 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="코드나 질문을 입력하세요. (Enter 전송, Shift+Enter 줄바꿈)"
            rows={1}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent text-sm leading-6 placeholder:text-muted-foreground/60 focus:outline-none px-2 py-1.5 min-h-[28px] max-h-[200px]"
          />
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="shrink-0 h-8 w-8"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/70 text-center">
          AI는 실수할 수 있어요. 중요한 정보는 검증하세요.
        </p>
      </div>
    </div>
  )
}
