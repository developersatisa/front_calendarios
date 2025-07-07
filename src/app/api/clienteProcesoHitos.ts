import api from './axiosConfig'

export interface ClienteProcesoHito {
  id: number
  cliente_proceso_id: number
  hito_id: number
  estado: string
  fecha_estado: string | null
  fecha_inicio: string
  fecha_fin: string | null
}

export interface ClienteProcesoHitosResponse {
  clienteProcesoHitos: ClienteProcesoHito[]
  total: number
}

export const getAllClienteProcesoHitos = async (page?: number, limit?: number) => {
  const params = new URLSearchParams()
  if (page) params.append('page', page.toString())
  if (limit) params.append('limit', limit.toString())

  const response = await api.get<ClienteProcesoHitosResponse>(`/cliente-proceso-hitos?${params.toString()}`)
  return response.data
}

export const createClienteProcesoHito = async (clienteProcesoHito: Omit<ClienteProcesoHito, 'id'>) => {
  const response = await api.post<ClienteProcesoHito>('/cliente-proceso-hitos', clienteProcesoHito)
  return response.data
}

export const updateClienteProcesoHito = async (id: number, clienteProcesoHito: Omit<ClienteProcesoHito, 'id'>) => {
  const response = await api.put<ClienteProcesoHito>(`/cliente-proceso-hitos/${id}`, clienteProcesoHito)
  return response.data
}

export const deleteClienteProcesoHito = async (id: number) => {
  return await api.delete(`/cliente-proceso-hitos/${id}`)
}

export const getClienteProcesoHitosByProceso = async (idClienteProceso: number) => {
  const response = await api.get<ClienteProcesoHito[]>(`/cliente-proceso-hitos/cliente-proceso/${idClienteProceso}`)
  return response.data
}

// Cambia el estado de un hito a 'finalizado'
export const finalizarClienteProcesoHito = async (id: number) => {
  const response = await api.put<ClienteProcesoHito>(`/cliente-proceso-hitos/${id}`, {
    estado: 'Finalizado',
    fecha_estado: new Date().toISOString(),
  })
  return response.data
}
