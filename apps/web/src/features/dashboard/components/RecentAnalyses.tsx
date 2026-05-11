import { ArrowRight, FileText, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRelative } from "@/lib/time"
import type { RecentAnalysisItem } from "../types"

const TYPE_ICON = {
  summary: Sparkles,
  readme: FileText,
  file_review: Sparkles,
}

const TYPE_LABEL = {
  summary: "요약",
  readme: "README",
  file_review: "리뷰",
}

export function RecentAnalyses({ items }: { items: RecentAnalysisItem[] }) {
  return (
    <Card className="border-border/40 bg-card/60">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm">최근 분석</CardTitle>
        <Link
          to="/projects"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          전체 보기 <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-0.5 pt-0">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            아직 분석이 없어요.
          </p>
        ) : (
          items.map((a) => {
            const Icon = TYPE_ICON[a.analysis_type]
            return (
              <Link
                key={a.id}
                to={`/projects/${a.project_id}`}
                className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/40 transition-colors group"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate group-hover:text-foreground text-foreground/90">
                    {a.project_name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {TYPE_LABEL[a.analysis_type]}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground shrink-0">
                  {formatRelative(a.created_at)}
                </div>
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
