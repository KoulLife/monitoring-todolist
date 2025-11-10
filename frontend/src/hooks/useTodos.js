import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  deleteCompletedTodos,
} from '../api/todos.js'

const QUERY_KEY = ['todos']

/**
 * 할 일 목록 조회 훅
 */
export const useTodosQuery = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getTodos,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 할 일 생성 훅
 */
export const useCreateTodo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/**
 * 할 일 수정 훅 (옵티미스틱 업데이트)
 */
export const useUpdateTodo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateTodo(id, updates),
    onMutate: async ({ id, updates }) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })

      // 이전 값 백업
      const previousTodos = queryClient.getQueryData(QUERY_KEY)

      // 옵티미스틱 업데이트
      queryClient.setQueryData(QUERY_KEY, (old) => {
        return old.map((todo) =>
          todo.id === id ? { ...todo, ...updates } : todo
        )
      })

      return { previousTodos }
    },
    onError: (err, variables, context) => {
      // 실패 시 롤백
      if (context?.previousTodos) {
        queryClient.setQueryData(QUERY_KEY, context.previousTodos)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/**
 * 할 일 삭제 훅 (옵티미스틱 업데이트)
 */
export const useDeleteTodo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTodo,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousTodos = queryClient.getQueryData(QUERY_KEY)

      queryClient.setQueryData(QUERY_KEY, (old) =>
        old.filter((todo) => todo.id !== id)
      )

      return { previousTodos }
    },
    onError: (err, variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(QUERY_KEY, context.previousTodos)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/**
 * 완료된 할 일 일괄 삭제 훅
 */
export const useDeleteCompletedTodos = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCompletedTodos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

