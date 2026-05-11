import { useQuery } from "@tanstack/react-query"
import { fetchMe } from "./api"
import { useAuthStore } from "./store"

/**
 * 현재 로그인 사용자.
 * 토큰이 있을 때만 fetch. 모든 컴포넌트가 ['me'] 캐시 공유.
 */
export function useMe() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
