/**
 * 클래스명 병합 유틸리티
 * @param {...string} classes
 * @returns {string}
 */
export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

/**
 * 날짜 포맷팅 (ISO 8601 -> 읽기 쉬운 형식)
 * @param {string} isoString - ISO 8601 형식의 날짜 문자열
 * @returns {string}
 */
export const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 검색 필터
 * @param {Array} todos - Todo 배열
 * @param {string} searchQuery - 검색어
 * @returns {Array}
 */
export const filterBySearch = (todos, searchQuery) => {
  if (!searchQuery.trim()) return todos
  const query = searchQuery.toLowerCase()
  return todos.filter((todo) => todo.title.toLowerCase().includes(query))
}

/**
 * 완료 상태 필터
 * @param {Array} todos - Todo 배열
 * @param {string} filter - 'all' | 'active' | 'completed'
 * @returns {Array}
 */
export const filterByStatus = (todos, filter) => {
  if (filter === 'all') return todos
  if (filter === 'active') return todos.filter((todo) => !todo.completed)
  if (filter === 'completed') return todos.filter((todo) => todo.completed)
  return todos
}

/**
 * 정렬 함수
 * @param {Array} todos - Todo 배열
 * @param {string} sortBy - 'createdAt' | 'title'
 * @param {string} order - 'asc' | 'desc'
 * @returns {Array}
 */
export const sortTodos = (todos, sortBy, order = 'desc') => {
  const sorted = [...todos]
  sorted.sort((a, b) => {
    if (sortBy === 'createdAt') {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return order === 'asc' ? dateA - dateB : dateB - dateA
    }
    if (sortBy === 'title') {
      const titleA = a.title.toLowerCase()
      const titleB = b.title.toLowerCase()
      if (order === 'asc') {
        return titleA.localeCompare(titleB)
      }
      return titleB.localeCompare(titleA)
    }
    return 0
  })
  return sorted
}

