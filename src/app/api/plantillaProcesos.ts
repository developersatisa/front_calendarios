import api from './axiosConfig'

export interface PlantillaProcesos {
  id: number
  plantilla_id: number
  proceso_id: number
}

export interface PlantillaProcesosResponse {
  plantillaProcesos: PlantillaProcesos[]
  total: number
}

export const getAllPlantillaProcesos = async (page?: number, limit?: number) => {
  const params = new URLSearchParams()
  if (page) params.append('page', page.toString())
  if (limit) params.append('limit', limit.toString())

  const response = await api.get<PlantillaProcesosResponse>(`/plantilla-procesos?${params.toString()}`)
  return response.data
}

export const createPlantillaProcesos = async (plantillaProceso: Omit<PlantillaProcesos, 'id'>) => {
  const response = await api.post<PlantillaProcesos>('/plantilla-procesos', plantillaProceso)
  return response.data
}

export const deletePlantillaProcesos = async (id: number) => {
  return await api.delete(`/plantilla-procesos/${id}`)
}

// Añadir nuevo método para obtener procesos por plantilla
export const getProcesosByPlantilla = async (plantillaId: number) => {
  const response = await api.get<PlantillaProcesos[]>(`/plantilla-procesos/plantilla/${plantillaId}`)
  return response.data
}
