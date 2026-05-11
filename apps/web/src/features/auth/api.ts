import { apiClient } from "@/lib/apiClient"

export type Token = {
  access_token: string
  token_type: string
  expires_in: number
}

export type User = {
  id: string
  email: string
  display_name: string
  is_active: boolean
  created_at: string
}

export type SignupPayload = {
  email: string
  password: string
  display_name: string
}

// OAuth2PasswordRequestForm — form-urlencoded with username/password fields.
export async function login(email: string, password: string): Promise<Token> {
  const body = new URLSearchParams({ username: email, password })
  const { data } = await apiClient.post<Token>("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  })
  return data
}

export async function signup(payload: SignupPayload): Promise<User> {
  const { data } = await apiClient.post<User>("/auth/signup", payload)
  return data
}

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/auth/me")
  return data
}
