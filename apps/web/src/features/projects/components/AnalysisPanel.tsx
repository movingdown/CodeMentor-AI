import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { MarkdownRenderer } from "@/features/chat/components/MarkdownRenderer"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/lib/apiClient"
import { useAnalyzeProject, useLatestAnalysis } from "../hooks"

export function AnalysisPanel({ projectId }: { projectId: string }) {
  const { data: latest } = useLatestAnalysis(projectId, "summary")
  const analyze = useAnalyzeProject(projectId)

  const handleAnalyze = async () => {
    try {
      await analyze.mutateAsync()
      toast.success("분석이 완료되었어요.")
    } catch (e) {
      toast.error(getApiErrorMessage(e, "분석에 실패했어요."))
    }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              프로젝트 요약
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              AI가 코드 구조와 기술 스택을 분석합니다.
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={analyze.isPending} size="sm">
            {analyze.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> 분석 중...
              </>
            ) : latest ? (
              "다시 분석"
            ) : (
              "분석 시작"
            )}
          </Button>
        </div>

        {latest?.result.text ? (
          <div className="rounded-lg border border-border/40 bg-card/40 p-5 text-sm">
            <MarkdownRenderer content={latest.result.text} />
            <div className="mt-4 pt-4 border-t border-border/40 text-[11px] text-muted-foreground">
              {new Date(latest.created_at).toLocaleString("ko-KR")} ·{" "}
              {latest.model}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/40 p-8 text-center text-sm text-muted-foreground">
            아직 분석된 내용이 없어요. <br />
            상단의 "분석 시작" 버튼을 눌러주세요.
          </div>
        )}
      </div>
    </div>
  )
}
