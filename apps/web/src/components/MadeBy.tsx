/**
 * 우하단 고정 크레딧 배지.
 * StatusBar가 없는 공개 페이지(랜딩/로그인/회원가입)에서 사용.
 * StatusBar가 있는 앱 페이지에서는 StatusBar 안에 인라인으로 표기하므로 쓰지 않는다.
 */
export function MadeBy() {
  return (
    <div className="fixed bottom-0 right-0 z-50 pointer-events-none select-none px-2 py-1 text-[10px] font-mono text-muted-foreground/50">
      made by movingdown
    </div>
  )
}
