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
    </QueryClientProvider>
  )
}
