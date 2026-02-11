import api from './axiosConfig'

export interface Subdepartamento {
  id: number
  codidepar: string | null
  codSubDepar: string | null
  nombre: string | null
  fechaini: string | null
  fechafin: string | null
}

export interface SubdepartamentosResponse {
  subdepartamentos: Subdepartamento[]
  total: number
}

export interface SubdepartamentoCliente {
  codSubDepar: string
  nombre: string
}

export const getAllSubdepartamentos = async (
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

  const response = await api.get<SubdepartamentosResponse>(`/subdepartamentos?${params.toString()}`)
  return response.data
}

export const getSubdepartamentoById = async (id: number) => {
  const response = await api.get<Subdepartamento>(`/subdepartamentos/${id}`)
  return response.data
}

export const getSubdepartamentosByCliente = async (clienteId: string) => {
  const response = await api.get<SubdepartamentoCliente[]>(`/subdepartamentos/cliente/${clienteId}`)
  return response.data
}
