import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TodoPage } from './pages/TodoPage.jsx'
import { ThemeToggle } from './components/ThemeToggle.jsx'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        {/* 헤더 */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                TODO List
              </h1>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="py-6 md:py-8">
          <TodoPage />
        </main>
      </div>
    </QueryClientProvider>
  )
}

export default App

