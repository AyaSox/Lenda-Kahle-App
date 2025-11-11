import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from '../api/axios'

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

// Helper: normalize user object from API (supports PascalCase and camelCase)
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
        // Clear any invalid token
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

      const response = await axios.get('/api/auth/profile')
      const normalized = normalizeUser(response.data)
      setUser(normalized)
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error.response?.data || error.message)
      
      // Only logout if it's an authentication error
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
      throw new Error(error.response?.data || 'Login failed')
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
      throw new Error(error.response?.data || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    // Optional: Clear any other stored auth data
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