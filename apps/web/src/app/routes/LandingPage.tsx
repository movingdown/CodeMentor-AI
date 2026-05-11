import { ArrowRight, Code2, Github, MessageSquare } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const FEATURES = [
  { icon: MessageSquare, title: "AI 채팅", desc: "코드 붙여넣고 바로 멘토링 받기." },
  { icon: Github, title: "Repo 분석", desc: "GitHub URL 하나로 프로젝트 요약." },
  { icon: Code2, title: "코드 리뷰", desc: "버그·성능·보안 6관점 분석." },
]

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/40">
        <div className="font-semibold tracking-tight">
          CodeMentor <span className="text-blue-400">AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/login">로그인</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">시작하기</Link>
          </Button>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 text-xs text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Powered by Gemini 2.5
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
          AI와 함께하는
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
            개발자 멘토링
          </span>
        </h1>
        <p className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto">
          코드 리뷰 · 리팩토링 · GitHub repo 분석 · README 자동 생성까지 한 곳에서.
        </p>
        <div className="mt-8 flex gap-3 justify-center flex-wrap">
          <Button asChild size="lg">
            <Link to="/signup">
              무료로 시작 <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/login">로그인</Link>
          </Button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-4">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-lg border border-border/40 bg-card/50 p-6 hover:bg-card/80 transition-colors"
          >
            <Icon className="h-5 w-5 text-blue-400 mb-3" />
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
