import axios, { AxiosError } from "axios"
import { useAuthStore } from "@/features/auth/store"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 30_000,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clear()
      const path = window.location.pathname
      if (!path.startsWith("/login") && !path.startsWith("/signup")) {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

type FastAPIError = { detail?: string }

export function getApiErrorMessage(
  error: unknown,
  fallback = "문제가 발생했습니다."
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as FastAPIError | undefined
    return data?.detail ?? error.message ?? fallback
  }
  return fallback
}

export const API_BASE_URL = BASE_URL
