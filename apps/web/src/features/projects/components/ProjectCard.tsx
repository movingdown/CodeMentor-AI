import { motion } from "framer-motion"
import {
  AlertCircle,
  ExternalLink,
  FolderGit2,
  Loader2,
  Trash2,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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

function StatusBadge({ status }: { status: ProjectStatus }) {
  const m = STATUS_MAP[status]
  return (
    <Badge variant="outline" className={cn("text-[10px]", m.className)}>
      {(status === "pending" || status === "analyzing") && (
        <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
      )}
      {m.label}
    </Badge>
  )
}

export function ProjectCard({
  project,
  onDelete,
}: {
  project: Project
  onDelete: (id: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-border/40 bg-card/60 hover:bg-card/80 hover:border-border/70 transition-colors group">
        <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-2 min-w-0">
            <FolderGit2 className="h-4 w-4 text-blue-400 shrink-0" />
            <div className="truncate text-sm font-medium">{project.name}</div>
          </div>
          <div className="flex items-center gap-1">
            <StatusBadge status={project.status} />
            <button
              onClick={(e) => {
                e.preventDefault()
                if (confirm("프로젝트를 삭제할까요?")) onDelete(project.id)
              }}
              className="p-1 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="삭제"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
          {project.error_message && (
            <div className="flex items-start gap-1.5 text-[11px] text-red-400">
              <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{project.error_message}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              {project.primary_lang && (
                <span className="font-mono">{project.primary_lang}</span>
              )}
              <span>{project.file_count} files</span>
            </div>
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:text-foreground flex items-center gap-1"
              >
                GitHub <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
          {project.status === "ready" && (
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="w-full mt-1 h-7 text-xs"
            >
              <Link to={`/projects/${project.id}`}>열기</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
