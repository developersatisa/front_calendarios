import api from './axiosConfig'

export interface Hito {
  id: number
  nombre: string
  frecuencia: number
  temporalidad: string
  fecha_inicio: string
  fecha_fin: string | null
  descripcion: string | null
  obligatorio: number
}

export interface HitosResponse {
  hitos: Hito[]
  total: number
}

export const getAllHitos = async (
  page?: number,
  limit?: number,
  sortField?: string,
  sortDirection?: 'asc' | 'desc'
) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  if (sortField) params.append('sort_field', sortField);
  if (sortDirection) params.append('sort_direction', sortDirection);

  const response = await api.get(`/hitos?${params.toString()}`)
  return response.data
}

export const createHito = async (hito: Omit<Hito, 'id'>) => {
  const response = await api.post<Hito>('/hitos', hito)
  return response.data
}

export const updateHito = async (id: number, hito: Omit<Hito, 'id'>) => {
  const response = await api.put<Hito>(`/hitos/${id}`, hito)
  return response.data
}

export const deleteHito = async (id: number) => {
  const response = await api.delete(`/hitos/${id}`)
  return response.data
}
