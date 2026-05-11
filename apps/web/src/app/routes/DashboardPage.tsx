import { FolderGit2, Loader2, MessageSquare, Sparkles, Zap } from "lucide-react"
import { useMe } from "@/features/auth/hooks"
import { DashboardEmptyState } from "@/features/dashboard/components/DashboardEmptyState"
import { QuickActions } from "@/features/dashboard/components/QuickActions"
import { RecentAnalyses } from "@/features/dashboard/components/RecentAnalyses"
import { RecentChats } from "@/features/dashboard/components/RecentChats"
import { RecentProjects } from "@/features/dashboard/components/RecentProjects"
import { StatCard } from "@/features/dashboard/components/StatCard"
import { UsageChart } from "@/features/dashboard/components/UsageChart"
import { useDashboardSummary } from "@/features/dashboard/hooks"

export function DashboardPage() {
  const { data: user } = useMe()
  const { data: summary, isLoading, isError } = useDashboardSummary()

  if (isLoading) {
    return (
      <div className="h-full overflow-auto">
        <div className="p-6 flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (isError || !summary) {
    return (
      <div className="h-full overflow-auto">
        <div className="p-6 text-center text-sm text-muted-foreground py-20">
          대시보드를 불러오지 못했어요. 새로고침해주세요.
        </div>
      </div>
    )
  }

  const isEmpty =
    summary.stats.total_chats === 0 &&
    summary.stats.total_projects === 0 &&
    summary.stats.total_analyses === 0

  if (isEmpty) {
    return (
      <div className="h-full overflow-auto">
        <DashboardEmptyState name={user?.display_name ?? "User"} />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              안녕하세요,{" "}
              <span className="text-blue-400">{user?.display_name}</span> 님
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              오늘은 어떤 코드를 살펴볼까요?
            </p>
          </div>
        </div>

        <QuickActions />

        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <StatCard
            icon={MessageSquare}
            label="채팅"
            value={summary.stats.total_chats}
            hint="전체 대화 수"
          />
          <StatCard
            icon={FolderGit2}
            label="프로젝트"
            value={summary.stats.total_projects}
            hint="임포트된 저장소"
          />
          <StatCard
            icon={Sparkles}
            label="분석"
            value={summary.stats.total_analyses}
            hint="요약 + README"
          />
          <StatCard
            icon={Zap}
            label="이번 달 AI 요청"
            value={summary.stats.ai_requests_this_month}
            hint="채팅 + 분석 합계"
          />
        </div>

        <UsageChart data={summary.usage_7days} />

        <div className="grid gap-4 lg:grid-cols-3">
          <RecentChats items={summary.recent_chats} />
          <RecentProjects items={summary.recent_projects} />
          <RecentAnalyses items={summary.recent_analyses} />
        </div>
      </div>
    </div>
  )
}
