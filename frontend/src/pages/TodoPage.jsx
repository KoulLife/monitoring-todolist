import { useState, useEffect, useMemo } from 'react'
import { useTodosQuery, useCreateTodo, useUpdateTodo, useDeleteTodo, useDeleteCompletedTodos } from '../hooks/useTodos.js'
import { filterBySearch, filterByStatus, sortTodos } from '../lib/utils.js'
import { TodoForm } from '../components/TodoForm.jsx'
import { TodoItem } from '../components/TodoItem.jsx'
import { Toolbar } from '../components/Toolbar.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { ErrorState } from '../components/ErrorState.jsx'
import { Skeleton } from '../components/Skeleton.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'

export const TodoPage = () => {
  const { data: todos = [], isLoading, error, refetch } = useTodosQuery()
  const createMutation = useCreateTodo()
  const updateMutation = useUpdateTodo()
  const deleteMutation = useDeleteTodo()
  const deleteCompletedMutation = useDeleteCompletedTodos()

  // URL 쿼리 파라미터 동기화
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('search') || ''
  })
  const [filter, setFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('filter') || 'all'
  })
  const [sortBy, setSortBy] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('sortBy') || 'createdAt'
  })
  const [sortOrder, setSortOrder] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('sortOrder') || 'desc'
  })

  // 삭제 확인 다이얼로그 상태
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, todoId: null })
  const [deleteCompletedDialog, setDeleteCompletedDialog] = useState(false)

  // URL 쿼리 파라미터 업데이트
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (filter !== 'all') params.set('filter', filter)
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder)

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }, [searchQuery, filter, sortBy, sortOrder])

  // 필터링 및 정렬된 할 일 목록
  const filteredTodos = useMemo(() => {
    let result = [...todos]
    result = filterBySearch(result, searchQuery)
    result = filterByStatus(result, filter)
    result = sortTodos(result, sortBy, sortOrder)
    return result
  }, [todos, searchQuery, filter, sortBy, sortOrder])

  // 통계
  const stats = useMemo(() => {
    const active = todos.filter((t) => !t.completed).length
    const completed = todos.filter((t) => t.completed).length
    const hasCompleted = completed > 0
    const allSelected = todos.length > 0 && todos.every((t) => t.completed)
    const noneSelected = todos.length === 0 || todos.every((t) => !t.completed)
    return { active, completed, hasCompleted, allSelected, noneSelected }
  }, [todos])

  // 할 일 생성
  const handleCreate = (title) => {
    createMutation.mutate({ title, completed: false })
  }

  // 할 일 토글
  const handleToggle = (id, completed) => {
    updateMutation.mutate({ id, updates: { completed } })
  }

  // 할 일 수정
  const handleUpdate = (id, updates) => {
    updateMutation.mutate({ id, updates })
  }

  // 할 일 삭제
  const handleDelete = (id) => {
    setDeleteDialog({ isOpen: true, todoId: id })
  }

  const confirmDelete = () => {
    if (deleteDialog.todoId) {
      deleteMutation.mutate(deleteDialog.todoId)
    }
  }

  // 완료 항목 일괄 삭제
  const handleDeleteCompleted = () => {
    setDeleteCompletedDialog(true)
  }

  const confirmDeleteCompleted = () => {
    const completedIds = todos.filter((t) => t.completed).map((t) => t.id)
    if (completedIds.length > 0) {
      deleteCompletedMutation.mutate(completedIds)
    }
  }

  // 전체 선택/해제
  const handleSelectAll = () => {
    todos.forEach((todo) => {
      if (!todo.completed) {
        updateMutation.mutate({ id: todo.id, updates: { completed: true } })
      }
    })
  }

  const handleDeselectAll = () => {
    todos.forEach((todo) => {
      if (todo.completed) {
        updateMutation.mutate({ id: todo.id, updates: { completed: false } })
      }
    })
  }

  // 샘플 데이터 추가
  const handleAddSample = () => {
    const samples = [
      { title: 'React 프로젝트 시작하기', completed: false },
      { title: 'API 연동하기', completed: false },
      { title: '다크모드 구현하기', completed: true },
    ]
    samples.forEach((sample) => {
      createMutation.mutate(sample)
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <Skeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* 할 일 입력 폼 */}
      <TodoForm onSubmit={handleCreate} isLoading={createMutation.isPending} />

      {/* 툴바 */}
      <Toolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => {
          setSortBy(by)
          setSortOrder(order)
        }}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDeleteCompleted={handleDeleteCompleted}
        hasCompleted={stats.hasCompleted}
        allSelected={stats.allSelected}
        noneSelected={stats.noneSelected}
      />

      {/* 할 일 목록 */}
      {filteredTodos.length === 0 ? (
        <EmptyState onAddSample={todos.length === 0 ? handleAddSample : null} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 하단 통계 */}
      {todos.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border border-black/5 dark:border-white/10 shadow-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{stats.active}</span>개 남음
            {stats.completed > 0 && (
              <>
                {' · '}
                <span className="font-medium">{stats.completed}</span>개 완료
              </>
            )}
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, todoId: null })}
        onConfirm={confirmDelete}
        title="할 일 삭제"
        message="정말로 이 할 일을 삭제하시겠습니까?"
      />

      <ConfirmDialog
        isOpen={deleteCompletedDialog}
        onClose={() => setDeleteCompletedDialog(false)}
        onConfirm={confirmDeleteCompleted}
        title="완료 항목 삭제"
        message={`완료된 ${stats.completed}개의 할 일을 모두 삭제하시겠습니까?`}
      />
    </div>
  )
}

