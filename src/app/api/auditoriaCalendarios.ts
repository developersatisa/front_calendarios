import api from './axiosConfig'

export interface AuditoriaCalendario {
  id: number
  cliente_id: string
  hito_id: number
  campo_modificado: string
  valor_anterior: string | null
  valor_nuevo: string | null
  observaciones: string | null
  motivo: number
  motivo_descripcion: string
  usuario: string
  nombre_usuario: string
  codSubDepar: string
  fecha_modificacion: string
  created_at: string | null
  updated_at: string | null
  nombre_subdepar: string
  proceso_nombre: string
  hito_nombre: string
  tipo: string
  critico: boolean
  obligatorio: boolean
  fecha_limite_anterior: string | null
  fecha_limite_actual: string | null
  momento_cambio: string | null
}

export interface AuditoriaCalendarioCreate {
  cliente_id: string
  hito_id: number
  campo_modificado: string
  valor_anterior: string | null
  valor_nuevo: string | null
  /** @deprecated use usuario instead */
  usuario_modificacion?: string
  usuario: string
  observaciones?: string | null
  /** 1=Configuración | 2=A petición de Atisa | 3=A petición de cliente | 4=A petición de tercero */
  motivo: number
  codSubDepar?: string | null
}

export const MOTIVOS_AUDITORIA = [
  { id: 1, label: 'Configuración' },
  { id: 2, label: 'A petición de Atisa' },
  { id: 3, label: 'A petición de cliente' },
  { id: 4, label: 'A petición de tercero' },
] as const

export type MotivoAuditoria = typeof MOTIVOS_AUDITORIA[number]['id']

export interface AuditoriaCalendariosResponse {
  auditoria: AuditoriaCalendario[]
  total: number
}

export interface AuditoriaClienteResponse {
  total: number
  auditoria_calendarios: AuditoriaCalendario[]
}

export const getAllAuditoriaCalendarios = async (
  page?: number,
  limit?: number,
  hitoId?: number,
  fechaDesde?: string,
  fechaHasta?: string,
  clienteId?: string
) => {
  const params = new URLSearchParams()
  if (page) params.append('page', page.toString())
  if (limit) params.append('limit', limit.toString())
  if (clienteId) params.append('cliente_id', clienteId)
  if (hitoId) params.append('hito_id', hitoId.toString())
  if (fechaDesde) params.append('fecha_desde', fechaDesde)
  if (fechaHasta) params.append('fecha_hasta', fechaHasta)

  const response = await api.get<AuditoriaCalendariosResponse>(`/auditoria-calendarios?${params.toString()}`)
  return response.data
}

export const createAuditoriaCalendario = async (auditoria: AuditoriaCalendarioCreate) => {
  const response = await api.post<AuditoriaCalendario>('/auditoria-calendarios', auditoria)
  return response.data
}

export const getAuditoriaCalendarioById = async (id: number) => {
  const response = await api.get<AuditoriaCalendario>(`/auditoria-calendarios/${id}`)
  return response.data
}

export const getAuditoriaCalendarioByHito = async (hitoId: number) => {
  const response = await api.get<AuditoriaCalendario[]>(`/auditoria-calendarios/hito/${hitoId}`)
  return response.data
}

export const getAuditoriaCalendariosByCliente = async (
  clienteId: string,
  page?: number,
  limit?: number,
  sortField?: string,
  sortDirection: string = 'desc',
  fechaDesde?: string,
  fechaHasta?: string,
  filtrosAdicionales?: Record<string, any>
) => {
  const params = new URLSearchParams()
  if (page) params.append('page', page.toString())
  if (limit) params.append('limit', limit.toString())
  if (sortField) params.append('sort_field', sortField)
  params.append('sort_direction', sortDirection)
  if (fechaDesde) params.append('fecha_desde', fechaDesde)
  if (fechaHasta) params.append('fecha_hasta', fechaHasta)

  if (filtrosAdicionales) {
    Object.keys(filtrosAdicionales).forEach(key => {
      const val = filtrosAdicionales[key]
      if (val !== undefined && val !== null && val !== '') {
        // Support arrays
        if (Array.isArray(val)) {
          if (val.length > 0) {
            params.append(key, val.join(','))
          }
        } else {
          params.append(key, val.toString())
        }
      }
    })
  }

  const response = await api.get<AuditoriaClienteResponse>(`/auditoria-calendarios/cliente/${clienteId}?${params.toString()}`)
  return response.data
}

export const generarInformeAuditoria = async (fechaDesde: string, fechaHasta: string) => {
  const response = await api.get(`/auditoria-calendarios/informe?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`, {
    responseType: 'blob'
  })
  return response.data
}
