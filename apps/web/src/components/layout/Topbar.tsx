import { Search } from "lucide-react"

export function Topbar() {
  return (
    <header className="h-12 shrink-0 border-b border-border/40 bg-card/20 px-4 flex items-center gap-4">
      <div className="text-xs text-muted-foreground font-mono">
        codementor-ai · main
      </div>
      <div className="flex-1 max-w-md ml-auto">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="search"
            placeholder="명령 검색 (⌘K)"
            disabled
            className="w-full h-7 pl-8 pr-2 text-xs rounded-md bg-muted/40 border border-border/40 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-blue-400/50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </header>
  )
}
