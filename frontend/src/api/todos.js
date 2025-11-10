import client from './client.js'

/**
 * 모든 할 일 조회
 * @returns {Promise<Array>} Todo 배열
 */
export const getTodos = async () => {
  const response = await client.get('/todos')
  return response.data
}

/**
 * 할 일 생성
 * @param {Object} todo - { title: string, completed?: boolean }
 * @returns {Promise<Object>} 생성된 Todo
 */
export const createTodo = async (todo) => {
  const response = await client.post('/todos', todo)
  return response.data
}

/**
 * 할 일 수정
 * @param {number} id - Todo ID
 * @param {Object} updates - { title?: string, completed?: boolean }
 * @returns {Promise<Object>} 수정된 Todo
 */
export const updateTodo = async (id, updates) => {
  const response = await client.put(`/todos/${id}`, updates)
  return response.data
}

/**
 * 할 일 삭제
 * @param {number} id - Todo ID
 * @returns {Promise<void>}
 */
export const deleteTodo = async (id) => {
  await client.delete(`/todos/${id}`)
}

/**
 * 완료된 할 일 일괄 삭제
 * @param {Array<number>} ids - 삭제할 Todo ID 배열
 * @returns {Promise<void>}
 */
export const deleteCompletedTodos = async (ids) => {
  await Promise.all(ids.map((id) => deleteTodo(id)))
}

