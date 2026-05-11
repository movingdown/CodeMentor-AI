import { Code2, Lightbulb, MessageSquare } from "lucide-react"

const SUGGESTIONS = [
  { icon: Code2, text: "이 코드를 리뷰해줘" },
  { icon: Lightbulb, text: "리스트 컴프리헨션이 뭐야?" },
  { icon: MessageSquare, text: "SOLID 원칙을 예시와 함께 설명해줘" },
]

type Props = {
  onSuggestionClick?: (text: string) => void
}

export function EmptyState({ onSuggestionClick }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
        <MessageSquare className="h-6 w-6 text-white" />
      </div>
      <h2 className="text-xl font-semibold mb-1">무엇을 도와드릴까요?</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        코드를 붙여넣고 리뷰를 받거나, 개발 관련 무엇이든 물어보세요.
      </p>
      <div className="grid sm:grid-cols-3 gap-2 max-w-2xl w-full">
        {SUGGESTIONS.map(({ icon: Icon, text }) => (
          <button
            key={text}
            onClick={() => onSuggestionClick?.(text)}
            className="flex items-start gap-2 p-3 rounded-lg border border-border/40 bg-card/40 hover:bg-card/80 hover:border-border/60 transition-colors text-left text-xs"
          >
            <Icon className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
            <span className="text-foreground/80">{text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
