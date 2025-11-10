import { AlertCircle, RefreshCw } from 'lucide-react'

export const ErrorState = ({ error, onRetry }) => {
  const errorMessage =
    error?.response?.data?.message || error?.message || '알 수 없는 오류가 발생했습니다.'

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-6">
        <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
        오류가 발생했습니다
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-sm">
        {errorMessage}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-medium focus-ring transition-all duration-200 flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          다시 시도
        </button>
      )}
    </div>
  )
}

