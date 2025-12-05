import api from './axiosConfig'
import { getAuth } from '../modules/auth/core/AuthHelpers'

/**
 * Obtiene el email/usuario del usuario logueado desde el token JWT
 * @returns El email o username del usuario, o null si no se puede obtener
 */
const getCurrentUserEmail = (): string | null => {
  try {
    const auth = getAuth()

    if (!auth?.api_token) {
      return null
    }

    // Decodificar el JWT (solo la parte del payload)
    const payload = JSON.parse(atob(auth.api_token.split('.')[1]))

    // Intentar obtener el email o username del payload
    // El backend puede incluir 'email', 'username', 'sub', o 'preferred_username'
    return payload.email || payload.username || payload.sub || payload.preferred_username || null
  } catch (error) {
    console.warn('Error obteniendo usuario del token JWT:', error)
    return null
  }
}

// Interfaces para las respuestas de métricas
export interface CumplimientoHitosResponse {
  porcentajeGeneral: number
  tendencia: string
}

export interface ProcesoData {
  nombreProceso: string
  hitosPendientes: number
  hitosCompletados: number
}

export interface ClienteData {
  clienteId: string
  clienteNombre: string
  hitosPendientes?: number
  hitosCompletados?: number
}

export interface HitosPorProcesoResponse {
  totalPendientes: number
  tendencia: string
  procesoData: ProcesoData[]
  clientesData?: ClienteData[]
}

export interface ResolucionData {
  periodo: string
  tiempoMedio: number
}

export interface TiempoResolucionResponse {
  tiempoMedioDias: number
  tendencia: string
  resolucionData: ResolucionData[]
}

export interface HitosVencidosResponse {
  totalVencidos: number
  tendencia: string
}

export interface ClientesInactivosResponse {
  totalInactivos: number
  tendencia: string
}

export interface VolumenData {
  mes: string
  hitosCreados: number
  hitosCompletados: number
}

export interface VolumenMensualResponse {
  totalMesActual: number
  tendencia: string
  volumenData: VolumenData[]
}

export interface MetricaResumen {
  valor: string | number
  tendencia: string
}

export interface ResumenMetricasResponse {
  hitosCompletados: MetricaResumen
  hitosPendientes: MetricaResumen
  hitosVencidos: MetricaResumen
  clientesInactivos: MetricaResumen
}

// Funciones de API
export const getCumplimientoHitos = async (clienteId?: string): Promise<CumplimientoHitosResponse> => {
  const userEmail = getCurrentUserEmail()
  if (!userEmail) {
    throw new Error('No se pudo obtener el usuario logueado')
  }

  const params: { email: string; cliente_id?: string } = { email: userEmail }
  if (clienteId) {
    params.cliente_id = clienteId.trim()
  }

  const response = await api.get('/metricas/cumplimiento-hitos', { params })
  return response.data
}

export const getHitosPorProceso = async (clienteId?: string): Promise<HitosPorProcesoResponse> => {
  const userEmail = getCurrentUserEmail()
  if (!userEmail) {
    throw new Error('No se pudo obtener el usuario logueado')
  }

  const params: { email: string; cliente_id?: string } = { email: userEmail }
  if (clienteId) {
    params.cliente_id = clienteId.trim()
  }

  const response = await api.get('/metricas/hitos-por-proceso', { params })
  return response.data
}

export const getTiempoResolucion = async (clienteId?: string): Promise<TiempoResolucionResponse> => {
  const userEmail = getCurrentUserEmail()
  if (!userEmail) {
    throw new Error('No se pudo obtener el usuario logueado')
  }

  const params: { email: string; cliente_id?: string } = { email: userEmail }
  if (clienteId) {
    params.cliente_id = clienteId.trim()
  }

  const response = await api.get('/metricas/tiempo-resolucion', { params })
  return response.data
}

export const getHitosVencidos = async (): Promise<HitosVencidosResponse> => {
  const userEmail = getCurrentUserEmail()
  if (!userEmail) {
    throw new Error('No se pudo obtener el usuario logueado')
  }

  const response = await api.get('/api/metricas/hitos-vencidos', {
    params: { email: userEmail }
  })
  return response.data
}

export const getClientesInactivos = async (): Promise<ClientesInactivosResponse> => {
  const userEmail = getCurrentUserEmail()
  if (!userEmail) {
    throw new Error('No se pudo obtener el usuario logueado')
  }

  const response = await api.get('/metricas/clientes-inactivos', {
    params: { email: userEmail }
  })
  return response.data
}

export const getVolumenMensual = async (clienteId?: string): Promise<VolumenMensualResponse> => {
  const userEmail = getCurrentUserEmail()
  if (!userEmail) {
    throw new Error('No se pudo obtener el usuario logueado')
  }

  const params: { email: string; cliente_id?: string } = { email: userEmail }
  if (clienteId) {
    params.cliente_id = clienteId.trim()
  }

  const response = await api.get('/metricas/volumen-mensual', { params })
  return response.data
}

export const getResumenMetricas = async (): Promise<ResumenMetricasResponse> => {
  const userEmail = getCurrentUserEmail()
  if (!userEmail) {
    throw new Error('No se pudo obtener el usuario logueado')
  }

  const response = await api.get('/metricas/resumen', {
    params: { email: userEmail }
  })
  return response.data
}
