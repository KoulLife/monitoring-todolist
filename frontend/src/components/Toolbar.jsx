import { Search, Filter, ArrowUpDown, CheckSquare, Square, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Toolbar = ({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  onSelectAll,
  onDeselectAll,
  onDeleteCompleted,
  hasCompleted,
  allSelected,
  noneSelected,
}) => {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 토글 */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="검색..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
            aria-label="할 일 검색"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-xl border transition-all duration-200 focus-ring ${
            showFilters
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}
          aria-label="필터 및 정렬"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* 필터 및 정렬 패널 */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-3">
          {/* 완료 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              상태 필터
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: '전체' },
                { value: 'active', label: '미완료' },
                { value: 'completed', label: '완료' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => onFilterChange(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 focus-ring ${
                    filter === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 정렬 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              정렬 기준
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'createdAt', label: '생성일' },
                { value: 'title', label: '제목' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    onSortChange(
                      option.value,
                      sortBy === option.value && sortOrder === 'desc' ? 'asc' : 'desc'
                    )
                  }
                  className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 focus-ring flex items-center gap-2 ${
                    sortBy === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* 일괄 작업 */}
          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onSelectAll}
              disabled={allSelected}
              className="flex-1 px-4 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              전체 선택
            </button>
            <button
              onClick={onDeselectAll}
              disabled={noneSelected}
              className="flex-1 px-4 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Square className="w-4 h-4" />
              전체 해제
            </button>
            <button
              onClick={onDeleteCompleted}
              disabled={!hasCompleted}
              className="flex-1 px-4 py-2 rounded-lg text-sm bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white focus-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              완료 항목 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

