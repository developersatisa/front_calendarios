import { useState, useCallback } from 'react'
import { refreshToken, isTokenExpiringSoon } from '../api/axiosConfig'
import { getAuth } from '../modules/auth/core/AuthHelpers'

interface UseRefreshTokenReturn {
  isRefreshing: boolean
  refreshTokenManually: () => Promise<void>
  isTokenExpiring: boolean
  checkTokenExpiration: () => boolean
}

/**
 * Hook personalizado para manejar el refresh token
 * Proporciona funciones para refrescar el token manualmente y verificar su expiración
 */
export const useRefreshToken = (): UseRefreshTokenReturn => {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshTokenManually = useCallback(async () => {
    if (isRefreshing) {
      return // Evitar múltiples llamadas simultáneas
    }

    setIsRefreshing(true)
    try {
      await refreshToken()
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw error
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing])

  const checkTokenExpiration = useCallback(() => {
    const auth = getAuth()
    const token = auth?.api_token

    if (!token) {
      return true
    }

    return isTokenExpiringSoon(token)
  }, [])

  const isTokenExpiring = checkTokenExpiration()

  return {
    isRefreshing,
    refreshTokenManually,
    isTokenExpiring,
    checkTokenExpiration
  }
}
