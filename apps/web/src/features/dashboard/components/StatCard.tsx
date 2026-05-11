import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  icon: LucideIcon
  label: string
  value: number | string
  hint?: string
}

export function StatCard({ icon: Icon, label, value, hint }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-border/40 bg-card/60 hover:bg-card/80 transition-colors">
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {label}
          </CardTitle>
          <Icon className="h-3.5 w-3.5 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          {hint && (
            <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
