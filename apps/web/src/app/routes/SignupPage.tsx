import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
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
import { login, signup } from "@/features/auth/api"
import { signupSchema, type SignupInput } from "@/features/auth/schemas"
import { useAuthStore } from "@/features/auth/store"
import { getApiErrorMessage } from "@/lib/apiClient"

export function SignupPage() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)
  const queryClient = useQueryClient()

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", display_name: "" },
  })

  const mutation = useMutation({
    mutationFn: async (input: SignupInput) => {
      await signup(input)
      return login(input.email, input.password)
    },
    onSuccess: async (token) => {
      setToken(token.access_token)
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      toast.success("환영합니다!")
      navigate("/dashboard", { replace: true })
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "회원가입에 실패했습니다."))
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">계정 만들기</CardTitle>
          <CardDescription>이메일과 비밀번호로 30초 만에 시작.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="display_name">이름</Label>
              <Input
                id="display_name"
                placeholder="홍길동"
                {...form.register("display_name")}
              />
              {form.formState.errors.display_name && (
                <p className="text-sm text-red-400">
                  {form.formState.errors.display_name.message}
                </p>
              )}
            </div>
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
              <Label htmlFor="password">비밀번호 (8자 이상)</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
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
              회원가입
            </Button>
          </form>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            이미 계정이 있나요?{" "}
            <Link to="/login" className="text-blue-400 hover:underline">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
