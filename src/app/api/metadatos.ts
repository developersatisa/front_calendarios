import api from './axiosConfig'

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface Metadato {
  id: number
  nombre: string
  descripcion?: string
  tipo_generacion: string
  global_: number | boolean
  activo: number | boolean
}

export interface MetadatoCreate {
  nombre: string
  descripcion?: string
  tipo_generacion: string
  global_: number | boolean
  activo: number | boolean
}

export type MetadatoUpdate = MetadatoCreate

export interface MetadatosResponse {
  metadatos: Metadato[]
  total: number
}

// ─── API Functions ───────────────────────────────────────────────────────────

export const getAllMetadatos = async (
  page?: number,
  limit?: number,
  sort_field?: string,
  sort_direction?: 'asc' | 'desc'
) => {
  const params = new URLSearchParams()
  if (page) params.append('page', page.toString())
  if (limit) params.append('limit', limit.toString())
  if (sort_field) params.append('sort_field', sort_field)
  if (sort_direction) params.append('sort_direction', sort_direction)

  const response = await api.get<MetadatosResponse>(`/metadatos?${params}`)
  return response.data
}

export const getMetadatoById = async (id: number) => {
  const response = await api.get<Metadato>(`/metadatos/${id}`)
  return response.data
}

export const createMetadato = async (metadato: MetadatoCreate) => {
  const response = await api.post<Metadato>('/metadatos', metadato)
  return response.data
}

export const updateMetadato = async (id: number, metadato: MetadatoUpdate) => {
  const response = await api.put<Metadato>(`/metadatos/${id}`, metadato)
  return response.data
}

export const deleteMetadato = async (id: number) => {
  return await api.delete(`/metadatos/${id}`)
}

export const getMetadatosVisibles = async (email: string) => {
  const params = new URLSearchParams({ email })
  const response = await api.get<Metadato[]>(`/metadatos/visibles?${params}`)
  return response.data
}
