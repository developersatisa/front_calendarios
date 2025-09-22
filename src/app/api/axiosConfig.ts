import axios from 'axios'
import { getAuth, setAuth, removeAuth } from '../modules/auth/core/AuthHelpers'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

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
  setAuth({
    api_token: access_token,
    refreshToken: refresh_token
  })
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

// Interceptor para añadir token a las peticiones
instance.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  }
)

// Interceptor para renovar token cuando expire
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = getRefreshToken()
        const response = await axios.post(`${BASE_URL}/refresh-token`, {
          refresh_token: refreshToken
        })
        const { access_token } = response.data
        setTokens(access_token)
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return instance(originalRequest)
      } catch (error) {
        // Si falla la renovación, limpiar tokens y redirigir a login
        removeAuth()
        throw error
      }
    }
    return Promise.reject(error)
  }
)

export default instance
