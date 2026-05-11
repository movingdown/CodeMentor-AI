import { Check, Copy, Download, FileText, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { MarkdownRenderer } from "@/features/chat/components/MarkdownRenderer"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/lib/apiClient"
import { useGenerateReadme, useLatestAnalysis } from "../hooks"

export function ReadmePreview({ projectId }: { projectId: string }) {
  const { data: latest } = useLatestAnalysis(projectId, "readme")
  const generate = useGenerateReadme(projectId)
  const [copied, setCopied] = useState(false)

  const markdown = latest?.result.markdown ?? ""

  const handleGenerate = async () => {
    try {
      await generate.mutateAsync()
      toast.success("README가 생성되었어요.")
    } catch (e) {
      toast.error(getApiErrorMessage(e, "README 생성에 실패했어요."))
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "README.md"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              README 자동 생성
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              파일 구조와 코드를 분석해 README.md를 만듭니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {markdown && (
              <>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {copied ? "복사됨" : "복사"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> 다운로드
                </Button>
              </>
            )}
            <Button onClick={handleGenerate} disabled={generate.isPending} size="sm">
              {generate.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> 생성 중...
                </>
              ) : markdown ? (
                "다시 생성"
              ) : (
                "생성 시작"
              )}
            </Button>
          </div>
        </div>

        {markdown ? (
          <div className="rounded-lg border border-border/40 bg-card/40 p-5 text-sm">
            <MarkdownRenderer content={markdown} />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/40 p-8 text-center text-sm text-muted-foreground">
            아직 생성된 README가 없어요. <br />
            상단의 "생성 시작" 버튼을 눌러주세요.
          </div>
        )}
      </div>
    </div>
  )
}
