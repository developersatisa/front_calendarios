import api from './axiosConfig'

export interface ClienteProcesoHitoCumplimiento {
  id?: number
  cliente_proceso_hito_id: number
  fecha: string
  hora: string
  observacion?: string
  usuario: string
}

export interface ClienteProcesoHitoCumplimientosResponse {
  cumplimientos: ClienteProcesoHitoCumplimiento[]
  total: number
}

export const getAllClienteProcesoHitoCumplimientos = async (
  page?: number,
  limit?: number,
  sortField?: string,
  sortDirection?: 'asc' | 'desc'
) => {
  const params = new URLSearchParams()
  if (page && page > 0) params.append('page', String(page))
  if (limit && limit > 0) params.append('limit', String(limit))
  if (sortField) params.append('sort_field', sortField)
  if (sortDirection) params.append('sort_direction', sortDirection)

  const response = await api.get<ClienteProcesoHitoCumplimientosResponse>(
    '/cliente-proceso-hito-cumplimientos' + (params.toString() ? `?${params.toString()}` : '')
  )

  return {
    cumplimientos: response.data?.cumplimientos || [],
    total: response.data?.total || 0
  }
}

export const getClienteProcesoHitoCumplimientoById = async (id: number) => {
  const response = await api.get<ClienteProcesoHitoCumplimiento>(`/cliente-proceso-hito-cumplimientos/${id}`)
  return response.data
}

export const createClienteProcesoHitoCumplimiento = async (
  cumplimiento: Omit<ClienteProcesoHitoCumplimiento, 'id'>
) => {
  const response = await api.post<ClienteProcesoHitoCumplimiento>('/cliente-proceso-hito-cumplimientos', cumplimiento)
  return response.data
}

export const updateClienteProcesoHitoCumplimiento = async (
  id: number,
  cumplimiento: Partial<Omit<ClienteProcesoHitoCumplimiento, 'id'>>
) => {
  const response = await api.put<ClienteProcesoHitoCumplimiento>(`/cliente-proceso-hito-cumplimientos/${id}`, cumplimiento)
  return response.data
}

export const deleteClienteProcesoHitoCumplimiento = async (id: number) => {
  return await api.delete(`/cliente-proceso-hito-cumplimientos/${id}`)
}
