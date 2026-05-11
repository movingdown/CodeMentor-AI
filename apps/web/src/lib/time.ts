/** 짧은 한국어 상대 시간. */
export function formatRelative(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input
  const diff = (Date.now() - date.getTime()) / 1000

  if (diff < 60) return "방금"
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86_400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 172_800) return "어제"
  if (diff < 604_800) return `${Math.floor(diff / 86_400)}일 전`

  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
}

/** 차트 X축용. "5/11" 형태. */
export function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
