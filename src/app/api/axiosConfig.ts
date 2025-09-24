import axios from 'axios'
import { getAuth, setAuth, removeAuth } from '../modules/auth/core/AuthHelpers'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

// Variable para controlar si ya hay una llamada de refresh en progreso
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (error?: any) => void
}> = []

// Funciones de manejo de tokens usando el sistema de Metronic
const getAccessToken = () => {
  const auth = getAuth()
  return auth?.api_token
}

const getRefreshToken = () => {
  const auth = getAuth()
  return auth?.refreshToken
}

const setTokens = (access_token: string, refresh_token?: string) => {
  const currentAuth = getAuth()
  setAuth({
    api_token: access_token,
    refreshToken: refresh_token || currentAuth?.refreshToken
  })
}

// Función para procesar la cola de requests fallidos
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })

  failedQueue = []
}

// Función para limpiar auth y redirigir al login
const clearAuthAndRedirect = () => {
  removeAuth()
  // Redirigir al login
  window.location.href = '/auth/login'
}

// Instancia principal de axios
const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Función de login inicial
export const login = async (username: string, apiKey: string) => {
  const response = await axios.post(`${BASE_URL}/token`,
    `username=${username}&password=${apiKey}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )
  const { access_token, refresh_token } = response.data
  setTokens(access_token, refresh_token)
  return response.data
}

// Función para refrescar token manualmente
export const refreshToken = async () => {
  const refreshTokenValue = getRefreshToken()

  if (!refreshTokenValue) {
    throw new Error('No refresh token available')
  }

  try {
    const response = await axios.post(`${BASE_URL}/refresh-token`, {
      refresh_token: refreshTokenValue
    })

    const { access_token, refresh_token: new_refresh_token } = response.data
    setTokens(access_token, new_refresh_token)

    return {
      access_token,
      refresh_token: new_refresh_token
    }
  } catch (error) {
    // Si falla el refresh, limpiar auth
    clearAuthAndRedirect()
    throw error
  }
}

// Función para verificar si el token está próximo a expirar
export const isTokenExpiringSoon = (token: string, thresholdMinutes: number = 5) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000 // Convertir a milisegundos
    const now = Date.now()
    const threshold = thresholdMinutes * 60 * 1000 // Convertir a milisegundos

    return (exp - now) < threshold
  } catch (error) {
    console.error('Error parsing token:', error)
    return true // Si no se puede parsear, asumir que está expirado
  }
}

// Interceptor para añadir token a las peticiones
instance.interceptors.request.use(
  async (config) => {
    const token = getAccessToken()
    if (token) {
      // Verificar si el token está próximo a expirar y refrescarlo proactivamente
      if (isTokenExpiringSoon(token)) {
        try {
          await refreshToken()
          const newToken = getAccessToken()
          if (newToken) {
            config.headers.Authorization = `Bearer ${newToken}`
          }
        } catch (error) {
          // Si falla el refresh proactivo, continuar con el token actual
          // El interceptor de response se encargará de manejarlo si es necesario
          config.headers.Authorization = `Bearer ${token}`
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para renovar token cuando expire
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si ya hay un refresh en progreso, agregar a la cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return instance(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = getRefreshToken()

        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post(`${BASE_URL}/refresh-token`, {
          refresh_token: refreshToken
        })

        const { access_token, refresh_token: new_refresh_token } = response.data

        // Actualizar tokens preservando el refresh token si no viene uno nuevo
        setTokens(access_token, new_refresh_token)

        // Procesar la cola de requests pendientes
        processQueue(null, access_token)

        // Actualizar el header del request original
        originalRequest.headers.Authorization = `Bearer ${access_token}`

        return instance(originalRequest)
      } catch (refreshError) {
        // Si falla la renovación, limpiar auth y redirigir
        processQueue(refreshError, null)
        clearAuthAndRedirect()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default instance
