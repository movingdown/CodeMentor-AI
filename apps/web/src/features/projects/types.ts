export type ProjectStatus = "pending" | "analyzing" | "ready" | "failed"
export type AnalysisType = "summary" | "readme" | "file_review"

export type Project = {
  id: string
  name: string
  source: "upload" | "github"
  github_url: string | null
  description: string | null
  default_branch: string | null
  primary_lang: string | null
  file_count: number
  total_bytes: number
  status: ProjectStatus
  error_message: string | null
  created_at: string
  updated_at: string
}

export type ProjectFileMeta = {
  id: string
  path: string
  language: string | null
  size_bytes: number
}

export type ProjectFile = ProjectFileMeta & {
  content: string | null
}

export type ProjectDetail = Project & {
  files: ProjectFileMeta[]
}

export type Analysis = {
  id: string
  project_id: string
  analysis_type: AnalysisType
  result: { text?: string; markdown?: string }
  model: string | null
  created_at: string
}
