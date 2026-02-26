import api from './axiosConfig'

// Interfaz extendida para el hito con toda la información necesaria
export interface HitoCompletoConInfo {
  // Campos del ClienteProcesoHito
  id: number
  cliente_proceso_id: number
  hito_id: number
  estado: string
  fecha_estado: string | null
  fecha_limite: string
  hora_limite: string | null
  tipo: string
  habilitado: number | boolean
  obligatorio: number | boolean
  critico: number | boolean

  // Información adicional del cliente
  cliente_id: string
  cliente_nombre: string
  codSubDepar?: string | null
  departamento_cliente?: string | null

  // Información adicional del proceso
  proceso_id: number
  proceso_nombre: string

  // Información adicional del hito maestro
  hito_nombre: string
  departamento?: string
  estado_proceso?: string
  estado_calculado?: string

  // Último cumplimiento (opcional)
  ultimo_cumplimiento?: {
    id: number
    fecha: string
    hora: string
    observacion?: string
    usuario: string
    fecha_creacion?: string
    num_documentos?: number
    departamento?: string
    codSubDepar?: string
  } | null
}

export interface StatusTodosClientesResponse {
  hitos: HitoCompletoConInfo[]
  total: number
}

/**
 * Obtiene todos los hitos habilitados de todos los clientes en una sola llamada optimizada
 * Este endpoint debe incluir toda la información necesaria para evitar múltiples llamadas
 */
export const getStatusTodosClientes = async (): Promise<StatusTodosClientesResponse> => {
  const response = await api.get<StatusTodosClientesResponse>('/status-todos-clientes/hitos')
  return response.data
}

/**
 * Obtiene los hitos habilitados para un usuario específico (no admin)
 * Requiere el email del usuario en el payload
 */
export const getStatusTodosClientesByUser = async (email: string): Promise<StatusTodosClientesResponse> => {
  const params = new URLSearchParams()
  params.append('email', email)
  const response = await api.get<StatusTodosClientesResponse>(`/cliente-proceso-hitos/status-todos-clientes/hitos?${params.toString()}`)
  return response.data
}

/**
 * Obtiene todos los hitos habilitados de un cliente en una sola llamada optimizada
 */
export const getStatusCliente = async (clienteId: string): Promise<StatusTodosClientesResponse> => {
  const response = await api.get<StatusTodosClientesResponse>(
    `/status-cliente/${clienteId}/hitos?ordenar_por=fecha_limite&orden=asc`
  )
  return response.data
}
