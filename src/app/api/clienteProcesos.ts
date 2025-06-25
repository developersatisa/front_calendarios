import api from './axiosConfig'

export interface ClienteProceso {
  id: number
  idcliente: string
  id_proceso: number
  fecha_inicio: string
  fecha_fin: string | null
  mes: number | null
  anio: number | null
}

export interface ClienteProcesosResponse {
  clienteProcesos: ClienteProceso[]
  total: number
}

export interface GenerarCalendarioParams {
  idcliente: number
  id_proceso: number
  fecha_inicio: string
}

export const getAllClienteProcesos = async (page?: number, limit?: number) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());

  const response = await api.get<ClienteProcesosResponse>(`/cliente-procesos?${params.toString()}`);
  return response.data
}

export const createClienteProceso = async (clienteProceso: Omit<ClienteProceso, 'id'>) => {
  const response = await api.post<ClienteProceso>('/cliente-procesos', clienteProceso)
  return response.data
}

export const updateClienteProceso = async (id: number, clienteProceso: Omit<ClienteProceso, 'id'>) => {
  const response = await api.put<ClienteProceso>(`/cliente-procesos/${id}`, clienteProceso)
  return response.data
}

export const deleteClienteProceso = async (id: number) => {
  return await api.delete(`/cliente-procesos/${id}`)
}

export const getClienteProcesosByCliente = async (idcliente: string) => {
  const response = await api.get<ClienteProcesosResponse>(`/cliente-procesos/cliente/${idcliente}`);
  return response.data;
}

export const generarCalendarioClienteProceso = async (params: GenerarCalendarioParams) => {
  const response = await api.post('/generar-calendario-cliente-proceso', params)
  return response.data
}
