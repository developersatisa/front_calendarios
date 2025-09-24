import api from './axiosConfig'

const FIXED_EMAIL = 'david.burgos@atisa.es'

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

export interface HitosPorProcesoResponse {
  totalPendientes: number
  tendencia: string
  procesoData: ProcesoData[]
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
export const getCumplimientoHitos = async (): Promise<CumplimientoHitosResponse> => {
  const response = await api.get('/metricas/cumplimiento-hitos', {
    params: { email: FIXED_EMAIL }
  })
  return response.data
}

export const getHitosPorProceso = async (): Promise<HitosPorProcesoResponse> => {
  const response = await api.get('/metricas/hitos-por-proceso', {
    params: { email: FIXED_EMAIL }
  })
  return response.data
}

export const getTiempoResolucion = async (): Promise<TiempoResolucionResponse> => {
  const response = await api.get('/metricas/tiempo-resolucion', {
    params: { email: FIXED_EMAIL }
  })
  return response.data
}

export const getHitosVencidos = async (): Promise<HitosVencidosResponse> => {
  const response = await api.get('/api/metricas/hitos-vencidos', {
    params: { email: FIXED_EMAIL }
  })
  return response.data
}

export const getClientesInactivos = async (): Promise<ClientesInactivosResponse> => {
  const response = await api.get('/metricas/clientes-inactivos', {
    params: { email: FIXED_EMAIL }
  })
  return response.data
}

export const getVolumenMensual = async (): Promise<VolumenMensualResponse> => {
  const response = await api.get('/metricas/volumen-mensual', {
    params: { email: FIXED_EMAIL }
  })
  return response.data
}

export const getResumenMetricas = async (): Promise<ResumenMetricasResponse> => {
  const response = await api.get('/metricas/resumen', {
    params: { email: FIXED_EMAIL }
  })
  return response.data
}
