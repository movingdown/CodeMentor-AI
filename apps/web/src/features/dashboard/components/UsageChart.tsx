import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatShortDate } from "@/lib/time"
import type { UsageDay } from "../types"

type TooltipPayload = { value: number }
type CustomTooltipProps = {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border/60 bg-popover/95 backdrop-blur px-2.5 py-1.5 text-xs shadow-lg">
      <div className="font-mono text-muted-foreground">{label}</div>
      <div className="text-foreground tabular-nums">
        <span className="text-blue-400 font-medium">{payload[0].value}</span> 요청
      </div>
    </div>
  )
}

export function UsageChart({ data }: { data: UsageDay[] }) {
  const chartData = data.map((d) => ({
    date: formatShortDate(d.date),
    count: d.count,
  }))

  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <Card className="border-border/40 bg-card/60">
      <CardHeader className="pb-2 flex-row items-end justify-between space-y-0">
        <div>
          <CardTitle className="text-sm">최근 7일 사용량</CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            채팅 + 분석 요청
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold tabular-nums">{total}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            requests
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                content={<CustomTooltip />}
              />
              <Bar
                dataKey="count"
                fill="hsl(217 91% 60%)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
