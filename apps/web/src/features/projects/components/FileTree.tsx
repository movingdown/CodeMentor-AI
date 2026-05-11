import { ChevronRight, File, Folder, FolderOpen } from "lucide-react"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { ProjectFileMeta } from "../types"

type Node = {
  name: string
  path: string
  type: "file" | "folder"
  fileId?: string
  children?: Node[]
}

function buildTree(files: ProjectFileMeta[]): Node[] {
  const root: Node = { name: "", path: "", type: "folder", children: [] }
  for (const f of files) {
    const parts = f.path.split("/")
    let cur = root
    for (let i = 0; i < parts.length; i++) {
      const isLast = i === parts.length - 1
      const name = parts[i]
      const path = parts.slice(0, i + 1).join("/")
      let child = cur.children!.find((c) => c.name === name)
      if (!child) {
        child = {
          name,
          path,
          type: isLast ? "file" : "folder",
          fileId: isLast ? f.id : undefined,
          children: isLast ? undefined : [],
        }
        cur.children!.push(child)
      }
      cur = child
    }
  }
  const sort = (node: Node) => {
    if (!node.children) return
    node.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    node.children.forEach(sort)
  }
  sort(root)
  return root.children ?? []
}

function TreeNode({
  node,
  depth,
  activeFileId,
  onSelect,
}: {
  node: Node
  depth: number
  activeFileId: string | null
  onSelect: (fileId: string) => void
}) {
  const [open, setOpen] = useState(depth < 1)
  const isActive = node.type === "file" && node.fileId === activeFileId

  if (node.type === "file") {
    return (
      <button
        onClick={() => onSelect(node.fileId!)}
        className={cn(
          "w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded text-left transition-colors",
          isActive
            ? "bg-blue-500/15 text-blue-300"
            : "text-foreground/80 hover:bg-muted/40"
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        <File className="h-3 w-3 shrink-0 opacity-70" />
        <span className="truncate">{node.name}</span>
      </button>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1 px-2 py-1 text-xs text-foreground/70 hover:bg-muted/40 rounded transition-colors"
        style={{ paddingLeft: `${4 + depth * 12}px` }}
      >
        <ChevronRight
          className={cn("h-3 w-3 transition-transform", open && "rotate-90")}
        />
        {open ? (
          <FolderOpen className="h-3 w-3 text-blue-400" />
        ) : (
          <Folder className="h-3 w-3 text-blue-400/80" />
        )}
        <span className="truncate font-medium">{node.name}</span>
      </button>
      {open && node.children && (
        <div>
          {node.children.map((c) => (
            <TreeNode
              key={c.path}
              node={c}
              depth={depth + 1}
              activeFileId={activeFileId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree({
  files,
  activeFileId,
  onSelect,
}: {
  files: ProjectFileMeta[]
  activeFileId: string | null
  onSelect: (fileId: string) => void
}) {
  const tree = useMemo(() => buildTree(files), [files])
  return (
    <div className="h-full overflow-auto p-1.5 bg-card/20 border-r border-border/40">
      <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        Explorer
      </div>
      {tree.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          activeFileId={activeFileId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
