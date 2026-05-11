import { ArrowRight, FolderGit2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatRelative } from "@/lib/time"
import type { RecentProjectItem } from "../types"

const STATUS_STYLES: Record<RecentProjectItem["status"], string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  analyzing: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  ready: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-300 border-red-500/30",
}

const STATUS_LABEL: Record<RecentProjectItem["status"], string> = {
  pending: "대기",
  analyzing: "분석",
  ready: "준비됨",
  failed: "실패",
}

export function RecentProjects({ items }: { items: RecentProjectItem[] }) {
  return (
    <Card className="border-border/40 bg-card/60">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm">최근 프로젝트</CardTitle>
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
            아직 프로젝트가 없어요.
          </p>
        ) : (
          items.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/40 transition-colors group"
            >
              <FolderGit2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate group-hover:text-foreground text-foreground/90">
                  {p.name}
                </div>
                {p.primary_lang && (
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {p.primary_lang}
                  </div>
                )}
              </div>
              <Badge
                variant="outline"
                className={cn("text-[10px] shrink-0", STATUS_STYLES[p.status])}
              >
                {STATUS_LABEL[p.status]}
              </Badge>
              <div className="text-[11px] text-muted-foreground shrink-0 w-12 text-right">
                {formatRelative(p.created_at)}
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
