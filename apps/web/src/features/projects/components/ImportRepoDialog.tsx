import { Github, Loader2 } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage } from "@/lib/apiClient"
import { useImportRepo } from "../hooks"

export function ImportRepoDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const navigate = useNavigate()
  const importMutation = useImportRepo()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    try {
      const project = await importMutation.mutateAsync(url.trim())
      toast.success("임포트를 시작했어요.")
      setOpen(false)
      setUrl("")
      navigate(`/projects/${project.id}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "임포트에 실패했어요."))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Github className="h-3.5 w-3.5 mr-2" /> GitHub Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>GitHub Repository Import</DialogTitle>
          <DialogDescription>
            공개 저장소만 가능합니다. 50MB 이하 / 50개 파일까지 분석합니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="repo-url">Repository URL</Label>
            <Input
              id="repo-url"
              placeholder="https://github.com/owner/repo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              지원: <span className="font-mono">https://github.com/owner/repo</span>{" "}
              / <span className="font-mono">owner/repo</span>
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={importMutation.isPending || !url.trim()}
            >
              {importMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              )}
              임포트
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
