import { AlertCircle, FileText, Files, Loader2, Sparkles } from "lucide-react"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalysisPanel } from "@/features/projects/components/AnalysisPanel"
import { FileTree } from "@/features/projects/components/FileTree"
import { FileViewer } from "@/features/projects/components/FileViewer"
import { ProjectHeader } from "@/features/projects/components/ProjectHeader"
import { ReadmePreview } from "@/features/projects/components/ReadmePreview"
import { useProject } from "@/features/projects/hooks"

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: project, isLoading } = useProject(projectId)
  const [activeFileId, setActiveFileId] = useState<string | null>(null)

  if (isLoading || !project) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (project.status === "failed") {
    return (
      <div className="h-full flex flex-col">
        <ProjectHeader project={project} />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <AlertCircle className="h-8 w-8 text-red-400 mb-3" />
          <h3 className="font-semibold">임포트 실패</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            {project.error_message ?? "알 수 없는 오류가 발생했어요."}
          </p>
        </div>
      </div>
    )
  }

  if (project.status === "pending" || project.status === "analyzing") {
    return (
      <div className="h-full flex flex-col">
        <ProjectHeader project={project} />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400 mb-3" />
          <h3 className="font-semibold">저장소를 분석하고 있어요</h3>
          <p className="text-sm text-muted-foreground mt-2">
            트리 구조와 주요 파일을 가져오는 중입니다. 잠시만요...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ProjectHeader project={project} />

      <Tabs defaultValue="files" className="flex-1 flex flex-col min-h-0">
        <TabsList className="rounded-none bg-card/20 border-b border-border/40 justify-start h-9 px-2 gap-0.5">
          <TabsTrigger value="files" className="text-xs gap-1.5">
            <Files className="h-3.5 w-3.5" /> Files
          </TabsTrigger>
          <TabsTrigger value="readme" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" /> README
          </TabsTrigger>
          <TabsTrigger value="summary" className="text-xs gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="flex-1 min-h-0 m-0 outline-none">
          <div className="h-full flex">
            <div className="w-64 shrink-0">
              <FileTree
                files={project.files}
                activeFileId={activeFileId}
                onSelect={setActiveFileId}
              />
            </div>
            <div className="flex-1 min-w-0">
              <FileViewer projectId={project.id} fileId={activeFileId} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="readme" className="flex-1 min-h-0 m-0 outline-none">
          <ReadmePreview projectId={project.id} />
        </TabsContent>

        <TabsContent value="summary" className="flex-1 min-h-0 m-0 outline-none">
          <AnalysisPanel projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
