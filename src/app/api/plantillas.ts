import api from './axiosConfig'

export interface Plantilla {
  id: number
  nombre: string
  descripcion: string | null
}

export interface PlantillasResponse {
  plantillas: Plantilla[]
  total: number
}

export const getAllPlantillas = async (
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

  const response = await api.get<PlantillasResponse>(`/plantillas?${params.toString()}`)
  return response.data
}

export const createPlantilla = async (plantilla: Omit<Plantilla, 'id'>) => {
  const response = await api.post<Plantilla>('/plantillas', plantilla)
  return response.data
}

export const updatePlantilla = async (id: number, plantilla: Omit<Plantilla, 'id'>) => {
  const response = await api.put<Plantilla>(`/plantillas/${id}`, plantilla)
  return response.data
}

export const deletePlantilla = async (id: number) => {
  const response = await api.delete<void>(`/plantillas/${id}`)
  return response.data
}
