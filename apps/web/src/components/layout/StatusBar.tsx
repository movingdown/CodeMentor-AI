import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/apiClient"

type HealthResponse = {
  status: string
  service: string
  database?: string | null
}

export function StatusBar() {
  const { data, isError } = useQuery({
    queryKey: ["health"],
    queryFn: async () => (await apiClient.get<HealthResponse>("/health")).data,
    refetchInterval: 30_000,
    retry: false,
  })

  const connected = !isError && !!data

  return (
    <footer className="h-6 shrink-0 border-t border-border/40 bg-card/20 px-3 flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
      <div className="flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            connected
              ? "bg-emerald-400 shadow-[0_0_4px] shadow-emerald-400/60"
              : "bg-red-400"
          }`}
        />
        <span>{connected ? "Connected" : "Disconnected"}</span>
      </div>
      <span className="opacity-40">·</span>
      <span>Gemini 2.5 Flash</span>
      <span className="ml-auto opacity-60">made by movingdown · v0.1.0 · dev</span>
    </footer>
  )
}
