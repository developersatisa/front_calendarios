import api from './axiosConfig'

export interface AuditoriaCalendario {
  id: number
  cliente_id: string
  hito_id: number
  campo_modificado: string
  valor_anterior: string | null
  valor_nuevo: string | null
  usuario_modificacion: string
  fecha_modificacion: string
  observaciones: string | null
  created_at: string | null
  updated_at: string | null
}

export interface AuditoriaCalendarioCreate {
  cliente_id: string
  hito_id: number
  campo_modificado: string
  valor_anterior: string | null
  valor_nuevo: string | null
  usuario_modificacion: string
  observaciones?: string | null
}

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
  fechaHasta?: string
) => {
  const params = new URLSearchParams()
  if (page) params.append('page', page.toString())
  if (limit) params.append('limit', limit.toString())
  if (sortField) params.append('sort_field', sortField)
  params.append('sort_direction', sortDirection)
  if (fechaDesde) params.append('fecha_desde', fechaDesde)
  if (fechaHasta) params.append('fecha_hasta', fechaHasta)

  const response = await api.get<AuditoriaClienteResponse>(`/auditoria-calendarios/cliente/${clienteId}?${params.toString()}`)
  return response.data
}

export const generarInformeAuditoria = async (fechaDesde: string, fechaHasta: string) => {
  const response = await api.get(`/auditoria-calendarios/informe?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`, {
    responseType: 'blob'
  })
  return response.data
}
