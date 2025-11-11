import axios from 'axios'

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://localhost:7176',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance