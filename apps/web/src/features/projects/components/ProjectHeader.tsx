import { ExternalLink, FolderGit2, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Project, ProjectStatus } from "../types"

const STATUS_MAP: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "대기 중",
    className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  analyzing: {
    label: "분석 중",
    className: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  ready: {
    label: "준비됨",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  failed: {
    label: "실패",
    className: "bg-red-500/15 text-red-300 border-red-500/30",
  },
}

function StatusPill({ status }: { status: ProjectStatus }) {
  const m = STATUS_MAP[status]
  return (
    <Badge variant="outline" className={cn("text-[11px]", m.className)}>
      {(status === "pending" || status === "analyzing") && (
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      )}
      {m.label}
    </Badge>
  )
}

export function ProjectHeader({ project }: { project: Project }) {
  return (
    <div className="px-4 py-3 border-b border-border/40 bg-card/30 shrink-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <FolderGit2 className="h-4 w-4 text-blue-400 shrink-0" />
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{project.name}</div>
            {project.description && (
              <div className="text-xs text-muted-foreground truncate">
                {project.description}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {project.primary_lang && (
            <Badge variant="secondary" className="text-[10px] font-mono">
              {project.primary_lang}
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground">
            {project.file_count} files
          </span>
          <StatusPill status={project.status} />
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
