import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { AuthUser } from '@kozsd/shared'
import { authService, LoginCredentials, RegisterData } from '@/services/auth'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const queryClient = useQueryClient()

  // Get current user
  const {
    data: user,
    isLoading: isUserLoading,
    isError,
  } = useQuery(
    ['currentUser'],
    () => authService.getCurrentUser(),
    {
      enabled: isInitialized && authService.isAuthenticated(),
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Login mutation
  const loginMutation = useMutation(
    (credentials: LoginCredentials) => authService.login(credentials),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['currentUser'], data.user)
        toast.success('Login successful!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Login failed')
      },
    }
  )

  // Register mutation
  const registerMutation = useMutation(
    (data: RegisterData) => authService.register(data),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['currentUser'], data.user)
        toast.success('Registration successful!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Registration failed')
      },
    }
  )

  // Logout mutation
  const logoutMutation = useMutation(
    () => authService.logout(),
    {
      onSuccess: () => {
        queryClient.clear()
        toast.success('Logged out successfully')
      },
      onError: () => {
        // Still clear the cache even if logout API fails
        queryClient.clear()
      },
    }
  )

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user is authenticated
        if (authService.isAuthenticated()) {
          // The query will automatically fetch user data
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // Clear invalid tokens
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      } finally {
        setIsInitialized(true)
      }
    }

    initAuth()
  }, [])

  // Clear user data if there's an auth error
  useEffect(() => {
    if (isError && isInitialized) {
      queryClient.removeQueries(['currentUser'])
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }, [isError, isInitialized, queryClient])

  const isLoading = !isInitialized || (isUserLoading && authService.isAuthenticated())
  const isAuthenticated = !!user && authService.isAuthenticated()

  const contextValue: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}