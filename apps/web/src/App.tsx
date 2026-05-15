import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"
import { Toaster } from "sonner"
import { router } from "@/app/router"
import { queryClient } from "@/lib/queryClient"

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" theme="dark" />
      <div className="fixed bottom-0 right-0 z-50 pointer-events-none select-none px-2 py-0.5 text-[10px] font-mono text-muted-foreground/50">
        made by movingdown
      </div>
    </QueryClientProvider>
  )
}
