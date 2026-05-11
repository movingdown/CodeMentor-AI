import Editor from "@monaco-editor/react"
import { Loader2 } from "lucide-react"
import { useProjectFile } from "../hooks"

const LANG_MAP: Record<string, string> = {
  python: "python",
  typescript: "typescript",
  javascript: "javascript",
  java: "java",
  go: "go",
  rust: "rust",
  ruby: "ruby",
  php: "php",
  cpp: "cpp",
  c: "c",
  csharp: "csharp",
  swift: "swift",
  shell: "shell",
  sql: "sql",
  html: "html",
  css: "css",
  json: "json",
  yaml: "yaml",
  toml: "ini",
  markdown: "markdown",
}

export function FileViewer({
  projectId,
  fileId,
}: {
  projectId: string
  fileId: string | null
}) {
  const { data: file, isLoading } = useProjectFile(projectId, fileId)

  if (!fileId) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        파일을 선택하세요
      </div>
    )
  }

  if (isLoading || !file) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const language = LANG_MAP[file.language ?? ""] ?? "plaintext"

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border/40 font-mono bg-card/20 flex items-center justify-between">
        <span className="truncate">{file.path}</span>
        <span className="opacity-60">{file.size_bytes.toLocaleString()} B</span>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language}
          value={file.content ?? ""}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            scrollBeyondLastLine: false,
            renderLineHighlight: "none",
            padding: { top: 8 },
          }}
        />
      </div>
    </div>
  )
}
