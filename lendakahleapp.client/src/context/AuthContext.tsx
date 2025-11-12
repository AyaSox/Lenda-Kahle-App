import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import axios from 'axios'  

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://lenda-kahle-app.onrender.com'
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

const normalizeUser = (raw: any): User => {
  if (!raw) throw new Error('Invalid user payload')
  return {
    id: raw.id ?? raw.Id ?? '',
    email: raw.email ?? raw.Email ?? '',
    firstName: raw.firstName ?? raw.FirstName ?? '',
    lastName: raw.lastName ?? raw.LastName ?? '',
    roles: raw.roles ?? raw.Roles ?? []
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          await fetchUserProfile()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        localStorage.removeItem('token')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No token available')
      }

      const response = await axios.get('/api/auth/me')
      const normalized = normalizeUser(response.data)
      setUser(normalized)
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error.response?.data || error.message)
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout()
      }
      throw error
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await axios.post('/api/auth/login', { email, password })
      const token = response.data?.token ?? response.data?.Token
      const apiUser = response.data?.user ?? response.data?.User

      if (!token || !apiUser) {
        throw new Error('Invalid login response from server')
      }

      localStorage.setItem('token', token)
      setUser(normalizeUser(apiUser))
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message)
      
      const errorMessage = 
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Login failed. Please try again.'
      
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: any) => {
    try {
      setIsLoading(true)
      const response = await axios.post('/api/auth/register', userData)
      const token = response.data?.token ?? response.data?.Token
      const apiUser = response.data?.user ?? response.data?.User

      if (!token || !apiUser) {
        throw new Error('Invalid registration response from server')
      }

      localStorage.setItem('token', token)
      setUser(normalizeUser(apiUser))
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error.message)
      
      const errorMessage = 
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.response?.data?.error ||
        error.message ||
        'Registration failed. Please try again.'
      
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    sessionStorage.clear()
  }

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
