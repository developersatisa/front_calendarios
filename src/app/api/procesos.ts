import api from './axiosConfig'

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface Proceso {
  id: number
  nombre: string
  descripcion: string | null
  frecuencia: number
  temporalidad: string
  habilitado: number
}

export interface ProcesosResponse {
  procesos: Proceso[]
  total: number
}

// ─── API Functions ───────────────────────────────────────────────────────────

export const getAllProcesos = async (
  page?: number,
  limit?: number,
  sortField?: string,
  sortDirection?: 'asc' | 'desc'
) => {
  const params = new URLSearchParams()
  if (page) params.append('page', page.toString())
  if (limit) params.append('limit', limit.toString())
  if (sortField) params.append('sort_field', sortField)
  if (sortDirection) params.append('sort_direction', sortDirection)

  const response = await api.get<ProcesosResponse>(`/procesos?${params}`)
  return response.data
}

export const createProceso = async (proceso: Omit<Proceso, 'id'>) => {
  const response = await api.post<Proceso>('/procesos', proceso)
  return response.data
}

export const updateProceso = async (id: number, proceso: Omit<Proceso, 'id'>) => {
  const response = await api.put<Proceso>(`/procesos/${id}`, proceso)
  return response.data
}

export const deleteProceso = async (id: number) => {
  const response = await api.delete(`/procesos/${id}`)
  return response.data
}
