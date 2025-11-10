import { Plus } from 'lucide-react'
import { useState } from 'react'

export const TodoForm = ({ onSubmit, isLoading }) => {
  const [title, setTitle] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (trimmedTitle.length === 0 || trimmedTitle.length > 100) {
      return
    }
    onSubmit(trimmedTitle)
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="새 할 일을 입력하세요..."
        maxLength={100}
        disabled={isLoading}
        className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="새 할 일 입력"
      />
      <button
        type="submit"
        disabled={isLoading || !title.trim()}
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-medium focus-ring transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        aria-label="할 일 추가"
      >
        <Plus className="w-5 h-5" />
        추가
      </button>
    </form>
  )
}

