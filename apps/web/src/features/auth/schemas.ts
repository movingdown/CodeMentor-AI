import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
})
export type LoginInput = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요."),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다.")
    .max(128, "비밀번호가 너무 깁니다."),
  display_name: z
    .string()
    .min(1, "이름을 입력해주세요.")
    .max(100, "이름이 너무 깁니다."),
})
export type SignupInput = z.infer<typeof signupSchema>
