import { ArrowRight, MessageSquare } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRelative } from "@/lib/time"
import type { RecentChatItem } from "../types"

export function RecentChats({ items }: { items: RecentChatItem[] }) {
  return (
    <Card className="border-border/40 bg-card/60">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm">최근 채팅</CardTitle>
        <Link
          to="/chat"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          전체 보기 <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-0.5 pt-0">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            아직 채팅이 없어요.
          </p>
        ) : (
          items.map((c) => (
            <Link
              key={c.id}
              to={`/chat/${c.id}`}
              className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/40 transition-colors group"
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate group-hover:text-foreground text-foreground/90">
                  {c.title}
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground shrink-0">
                {formatRelative(c.updated_at)}
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
