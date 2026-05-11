import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  analyzeProject,
  deleteProject,
  generateReadme,
  getFile,
  getLatestAnalysis,
  getProject,
  importRepo,
  listProjects,
} from "./api"
import type { Project, ProjectDetail } from "./types"

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
    staleTime: 30_000,
    refetchInterval: (query) => {
      const list = query.state.data as Project[] | undefined
      return list?.some((p) => p.status === "pending" || p.status === "analyzing")
        ? 2000
        : false
    },
  })
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const s = (query.state.data as ProjectDetail | undefined)?.status
      return s === "pending" || s === "analyzing" ? 2000 : false
    },
  })
}

export function useProjectFile(
  projectId: string | undefined,
  fileId: string | null
) {
  return useQuery({
    queryKey: ["project-file", projectId, fileId],
    queryFn: () => getFile(projectId!, fileId!),
    enabled: !!projectId && !!fileId,
    staleTime: Infinity,
  })
}

export function useImportRepo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (url: string) => importRepo(url),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  })
}

export function useAnalyzeProject(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => analyzeProject(id),
    onSuccess: (analysis) => {
      qc.setQueryData(["latest-analysis", id, "summary"], analysis)
    },
  })
}

export function useGenerateReadme(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => generateReadme(id),
    onSuccess: (analysis) => {
      qc.setQueryData(["latest-analysis", id, "readme"], analysis)
    },
  })
}

export function useLatestAnalysis(
  id: string | undefined,
  type: "summary" | "readme"
) {
  return useQuery({
    queryKey: ["latest-analysis", id, type],
    queryFn: () => getLatestAnalysis(id!, type),
    enabled: !!id,
    staleTime: 60_000,
  })
}
