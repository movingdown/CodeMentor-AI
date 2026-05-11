import { ArrowRight, Github, MessageSquare, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ImportRepoDialog } from "@/features/projects/components/ImportRepoDialog"

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <button
        onClick={() => navigate("/chat")}
        className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/40 hover:bg-card/80 hover:border-border/70 transition-all text-left group"
      >
        <div className="h-8 w-8 rounded-md bg-blue-500/15 flex items-center justify-center shrink-0">
          <MessageSquare className="h-4 w-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium flex items-center justify-between">
            새 채팅
            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            AI에게 질문하기
          </div>
        </div>
      </button>

      <ImportRepoDialog
        trigger={
          <button className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/40 hover:bg-card/80 hover:border-border/70 transition-all text-left group">
            <div className="h-8 w-8 rounded-md bg-violet-500/15 flex items-center justify-center shrink-0">
              <Github className="h-4 w-4 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium flex items-center justify-between">
                GitHub Import
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                저장소 분석하기
              </div>
            </div>
          </button>
        }
      />

      <button
        onClick={() => navigate("/projects")}
        className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/40 hover:bg-card/80 hover:border-border/70 transition-all text-left group"
      >
        <div className="h-8 w-8 rounded-md bg-emerald-500/15 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium flex items-center justify-between">
            프로젝트 보기
            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            분석 결과 확인
          </div>
        </div>
      </button>
    </div>
  )
}
