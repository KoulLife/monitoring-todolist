import { ClipboardList, Plus } from 'lucide-react'

export const EmptyState = ({ onAddSample }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        <ClipboardList className="w-12 h-12 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
        할 일이 없습니다
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-sm">
        새로운 할 일을 추가하거나 샘플 데이터를 추가해보세요.
      </p>
      {onAddSample && (
        <button
          onClick={onAddSample}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-medium focus-ring transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          샘플 추가
        </button>
      )}
    </div>
  )
}

