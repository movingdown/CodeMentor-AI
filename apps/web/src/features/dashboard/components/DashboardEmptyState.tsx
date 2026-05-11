import { ArrowRight, Github, MessageSquare, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ImportRepoDialog } from "@/features/projects/components/ImportRepoDialog"

const STEPS = [
  {
    icon: MessageSquare,
    title: "AI와 대화하기",
    desc: "코드를 붙여넣고 리뷰·리팩토링을 받아보세요.",
  },
  {
    icon: Github,
    title: "GitHub repo 임포트",
    desc: "URL 하나로 프로젝트 구조와 코드를 분석합니다.",
  },
  {
    icon: Sparkles,
    title: "README 자동 생성",
    desc: "파일 분석을 기반으로 완성도 높은 README를 만들어드려요.",
  },
]

export function DashboardEmptyState({ name }: { name: string }) {
  const navigate = useNavigate()

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 text-xs text-muted-foreground mb-4">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px] shadow-emerald-400/60" />
        시작할 준비가 됐어요
      </div>
      <h1 className="text-3xl font-bold tracking-tight">
        환영합니다, <span className="text-blue-400">{name}</span> 님
      </h1>
      <p className="mt-3 text-muted-foreground">
        세 가지 방법으로 CodeMentor AI를 시작할 수 있어요.
      </p>

      <div className="mt-8 grid sm:grid-cols-3 gap-3 text-left">
        {STEPS.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-lg border border-border/40 bg-card/40 p-4"
          >
            <Icon className="h-4 w-4 text-blue-400 mb-2" />
            <div className="font-medium text-sm">{title}</div>
            <div className="text-xs text-muted-foreground mt-1">{desc}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2 justify-center">
        <Button onClick={() => navigate("/chat")}>
          채팅 시작 <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
        <ImportRepoDialog />
      </div>
    </div>
  )
}
