import api from './api'
import { AuthUser, AuthTokens } from '@kozsd/shared'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const response = await api.post<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>>(
      '/auth/login',
      credentials
    )
    
    const { user, tokens } = response.data.data
    
    // Store tokens
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    
    return { user, tokens }
  }

  async register(data: RegisterData): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const response = await api.post<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>>(
      '/auth/register',
      data
    )
    
    const { user, tokens } = response.data.data
    
    // Store tokens
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    
    return { user, tokens }
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken')
    
    try {
      await api.post('/auth/logout', { refreshToken })
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error)
    } finally {
      // Always clear local storage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  async getCurrentUser(): Promise<AuthUser> {
    const response = await api.get<ApiResponse<AuthUser>>('/auth/me')
    return response.data.data
  }

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await api.post<ApiResponse<{ tokens: AuthTokens }>>(
      '/auth/refresh',
      { refreshToken }
    )
    
    const { tokens } = response.data.data
    
    // Update stored tokens
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    
    return tokens
  }

  getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
    }
  }

  isAuthenticated(): boolean {
    const { accessToken } = this.getStoredTokens()
    return !!accessToken
  }
}

export const authService = new AuthService()