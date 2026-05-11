export type StatsSummary = {
  total_chats: number
  total_projects: number
  total_analyses: number
  ai_requests_this_month: number
}

export type UsageDay = {
  date: string
  count: number
}

export type RecentChatItem = {
  id: string
  title: string
  updated_at: string
}

export type RecentProjectItem = {
  id: string
  name: string
  status: "pending" | "analyzing" | "ready" | "failed"
  primary_lang: string | null
  created_at: string
}

export type RecentAnalysisItem = {
  id: string
  project_id: string
  project_name: string
  analysis_type: "summary" | "readme" | "file_review"
  created_at: string
}

export type DashboardSummary = {
  stats: StatsSummary
  usage_7days: UsageDay[]
  recent_chats: RecentChatItem[]
  recent_projects: RecentProjectItem[]
  recent_analyses: RecentAnalysisItem[]
}
