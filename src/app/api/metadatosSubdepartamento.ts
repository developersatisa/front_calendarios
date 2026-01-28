import api from './axiosConfig'

export interface MetadatoSubdepartamento {
  id: number
  id_metadato: number
  id_subdepartamento: number
}

export interface MetadatoSubdepartamentoCreate {
  id_metadato: number
  id_subdepartamento: number
}

export interface MetadatoSubdepartamentoResponse {
  metadatosSubdepartamento: MetadatoSubdepartamento[]
  total: number
}

export const getAllMetadatosSubdepartamento = async () => {
  const response = await api.get<MetadatoSubdepartamento[]>('/metadatos-subdepartamento')
  return response.data
}

export const getMetadatoSubdepartamentoById = async (id: number) => {
  const response = await api.get<MetadatoSubdepartamento>(`/metadatos-subdepartamento/${id}`)
  return response.data
}

export const createMetadatoSubdepartamento = async (metadatoSubdepartamento: MetadatoSubdepartamentoCreate) => {
  const response = await api.post<MetadatoSubdepartamento>('/metadatos-subdepartamento', metadatoSubdepartamento)
  return response.data
}

export const deleteMetadatoSubdepartamento = async (id: number) => {
  return await api.delete(`/metadatos-subdepartamento/${id}`)
}

export const getMetadatosSubdepartamentoByMetadato = async (idMetadato: number) => {
  const response = await api.get<MetadatoSubdepartamento[]>(`/metadatos-subdepartamento/metadato/${idMetadato}`)
  return response.data
}

export const deleteMetadatoSubdepartamentoByMetadato = async (idMetadato: number) => {
  return await api.delete(`/metadatos-subdepartamento/metadato/${idMetadato}`)
}
