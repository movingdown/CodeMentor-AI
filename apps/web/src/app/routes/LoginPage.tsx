import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/features/auth/api"
import { loginSchema, type LoginInput } from "@/features/auth/schemas"
import { useAuthStore } from "@/features/auth/store"
import { getApiErrorMessage } from "@/lib/apiClient"

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setToken = useAuthStore((s) => s.setToken)
  const queryClient = useQueryClient()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const mutation = useMutation({
    mutationFn: (input: LoginInput) => login(input.email, input.password),
    onSuccess: async (token) => {
      setToken(token.access_token)
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      toast.success("로그인되었습니다.")
      const state = location.state as { from?: { pathname?: string } } | null
      const from = state?.from?.pathname
      navigate(from || "/dashboard", { replace: true })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "로그인에 실패했습니다."))
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">
            CodeMentor <span className="text-blue-400">AI</span>
          </CardTitle>
          <CardDescription>개발자를 위한 AI 코드 분석 플랫폼</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-400">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-400">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              로그인
            </Button>
          </form>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            아직 계정이 없나요?{" "}
            <Link to="/signup" className="text-blue-400 hover:underline">
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
