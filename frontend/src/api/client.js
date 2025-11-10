import axios from 'axios'

// 개발 환경에서는 Vite 프록시를 사용 (상대 경로)
// 프로덕션에서는 환경 변수 또는 기본값 사용
const baseURL =
  import.meta.env.DEV
    ? '/api' // Vite 프록시 사용
    : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '/api'

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
client.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
client.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // CORS 에러 처리
    if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
      error.message = 'CORS 오류가 발생했습니다. 백엔드 서버의 CORS 설정을 확인하세요.'
    }
    // 서버에서 에러 메시지를 제공하는 경우 사용
    if (error.response?.data?.message) {
      error.message = error.response.data.message
    }
    return Promise.reject(error)
  }
)

export default client

