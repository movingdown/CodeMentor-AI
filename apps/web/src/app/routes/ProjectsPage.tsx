import { Loader2 } from "lucide-react"
import { ImportRepoDialog } from "@/features/projects/components/ImportRepoDialog"
import { ProjectCard } from "@/features/projects/components/ProjectCard"
import { useDeleteProject, useProjects } from "@/features/projects/hooks"

export function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const deleteMutation = useDeleteProject()

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 md:p-8 max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">프로젝트</h1>
            <p className="text-sm text-muted-foreground mt-1">
              GitHub repository를 임포트하고 AI 분석을 받아보세요.
            </p>
          </div>
          <ImportRepoDialog />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border/40 rounded-lg p-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              아직 임포트된 프로젝트가 없어요.
            </p>
            <ImportRepoDialog />
          </div>
        )}
      </div>
    </div>
  )
}
