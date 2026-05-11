import { apiClient } from "@/lib/apiClient"
import type {
  Analysis,
  Project,
  ProjectDetail,
  ProjectFile,
} from "./types"

export async function importRepo(url: string): Promise<Project> {
  const { data } = await apiClient.post<Project>("/github/import", { url })
  return data
}

export async function listProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<Project[]>("/projects")
  return data
}

export async function getProject(id: string): Promise<ProjectDetail> {
  const { data } = await apiClient.get<ProjectDetail>(`/projects/${id}`)
  return data
}

export async function getFile(
  projectId: string,
  fileId: string
): Promise<ProjectFile> {
  const { data } = await apiClient.get<ProjectFile>(
    `/projects/${projectId}/files/${fileId}`
  )
  return data
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/projects/${id}`)
}

export async function analyzeProject(id: string): Promise<Analysis> {
  const { data } = await apiClient.post<Analysis>(`/projects/${id}/analyze`)
  return data
}

export async function generateReadme(id: string): Promise<Analysis> {
  const { data } = await apiClient.post<Analysis>(`/projects/${id}/readme`)
  return data
}

export async function getLatestAnalysis(
  id: string,
  type: "summary" | "readme"
): Promise<Analysis | null> {
  const { data } = await apiClient.get<Analysis | null>(
    `/projects/${id}/analyses/latest`,
    { params: { type } }
  )
  return data
}
