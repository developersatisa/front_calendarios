import api from './axiosConfig'

export interface MetadatoArea {
  id: number
  id_metadato: number
  codSubDepar: string
}

export interface MetadatoAreaCreate {
  id_metadato: number
  codSubDepar: string
}

export interface MetadatoAreaResponse {
  metadatosArea: MetadatoArea[]
  total: number
}

export const getAllMetadatosArea = async () => {
  const response = await api.get<MetadatoArea[]>('/metadatos-area')
  return response.data
}

export const getMetadatoAreaById = async (id: number) => {
  const response = await api.get<MetadatoArea>(`/metadatos-area/${id}`)
  return response.data
}

export const createMetadatoArea = async (metadatoArea: MetadatoAreaCreate) => {
  const response = await api.post<MetadatoArea>('/metadatos-area', metadatoArea)
  return response.data
}

export const deleteMetadatoArea = async (id: number) => {
  return await api.delete(`/metadatos-area/${id}`)
}

export const deleteMetadatoAreaByMetadato = async (idMetadato: number) => {
  return await api.delete(`/metadatos-area/metadato/${idMetadato}`)
}
