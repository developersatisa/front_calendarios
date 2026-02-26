import api from './axiosConfig'

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface AuditoriaCalendario {
  id: number
  cliente_id: string
  cliente_nombre?: string
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
  usuario: string
  /** @deprecated use usuario instead */
  usuario_modificacion?: string
  observaciones?: string | null
  /** 1=Configuración | 2=A petición de Atisa | 3=A petición de cliente | 4=A petición de tercero */
  motivo: number
  codSubDepar?: string | null
}

export interface AuditoriaClienteResponse {
  total: number
  auditoria_calendarios: AuditoriaCalendario[]
}

export const MOTIVOS_AUDITORIA = [
  { id: 1, label: 'Configuración' },
  { id: 2, label: 'A petición de Atisa' },
  { id: 3, label: 'A petición de cliente' },
  { id: 4, label: 'A petición de tercero' },
] as const

export type MotivoAuditoria = typeof MOTIVOS_AUDITORIA[number]['id']

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Builds a URLSearchParams from a flat Record, skipping null/undefined/empty values. Arrays are joined with commas. */
const buildParams = (obj: Record<string, any>): URLSearchParams => {
  const params = new URLSearchParams()
  Object.entries(obj).forEach(([key, val]) => {
    if (val === undefined || val === null || val === '') return
    if (Array.isArray(val)) {
      if (val.length > 0) params.append(key, val.join(','))
    } else {
      params.append(key, String(val))
    }
  })
  return params
}

// ─── API Functions ───────────────────────────────────────────────────────────

/** Fetch all auditoría records (global – no client filter). */
export const getAuditoriaCalendariosGlobal = async (
  page?: number,
  limit?: number,
  sortField?: string,
  sortDirection: 'asc' | 'desc' = 'desc',
  fechaDesde?: string,
  fechaHasta?: string,
  extra?: Record<string, any>
) => {
  const params = buildParams({
    page,
    limit,
    sort_field: sortField,
    sort_direction: sortDirection,
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
    ...extra,
  })
  const response = await api.get<AuditoriaClienteResponse>(`/auditoria-calendarios?${params}`)
  return response.data
}

/** Fetch auditoría records filtered by client. */
export const getAuditoriaCalendariosByCliente = async (
  clienteId: string,
  page?: number,
  limit?: number,
  sortField?: string,
  sortDirection: 'asc' | 'desc' = 'desc',
  fechaDesde?: string,
  fechaHasta?: string,
  extra?: Record<string, any>
) => {
  const params = buildParams({
    page,
    limit,
    sort_field: sortField,
    sort_direction: sortDirection,
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
    ...extra,
  })
  const response = await api.get<AuditoriaClienteResponse>(
    `/auditoria-calendarios/cliente/${clienteId}?${params}`
  )
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

export const generarInformeAuditoria = async (fechaDesde: string, fechaHasta: string) => {
  const response = await api.get(
    `/auditoria-calendarios/informe?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`,
    { responseType: 'blob' }
  )
  return response.data
}
