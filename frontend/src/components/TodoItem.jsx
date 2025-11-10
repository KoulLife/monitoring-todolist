import { CheckSquare, Square, Trash2, Edit3 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { formatDate } from '../lib/utils.js'

export const TodoItem = ({ todo, onToggle, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const [showTooltip, setShowTooltip] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleEdit = () => {
    setIsEditing(true)
    setEditTitle(todo.title)
  }

  const handleSave = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed.length <= 100 && trimmed !== todo.title) {
      onUpdate(todo.id, { title: trimmed })
    } else {
      setEditTitle(todo.title)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(todo.title)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-black/5 dark:border-white/10 shadow-xl backdrop-blur transition-all duration-200 hover:shadow-2xl">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onToggle(todo.id, !todo.completed)}
          className="flex-shrink-0 focus-ring rounded"
          aria-label={todo.completed ? '완료 취소' : '완료'}
        >
          {todo.completed ? (
            <CheckSquare className="w-6 h-6 text-green-500 dark:text-green-400" />
          ) : (
            <Square className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              maxLength={100}
              className="w-full px-2 py-1 rounded bg-gray-50 dark:bg-gray-700 border border-blue-500 dark:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label="할 일 수정"
            />
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={`flex-1 ${
                  todo.completed
                    ? 'line-through text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {todo.title}
              </span>
              <button
                onClick={handleEdit}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus-ring transition-colors"
                aria-label="수정"
              >
                <Edit3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          )}

          <div
            className="relative inline-block mt-1"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatDate(todo.createdAt)}
            </span>
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded whitespace-nowrap z-10">
                {new Date(todo.createdAt).toLocaleString('ko-KR')}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(todo.id)}
          className="flex-shrink-0 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 focus-ring transition-colors"
          aria-label="삭제"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

