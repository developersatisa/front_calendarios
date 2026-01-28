import api from './axiosConfig'

export interface ClienteProcesoHito {
  id: number
  cliente_proceso_id: number
  hito_id: number
  estado: string
  fecha_estado: string | null
  fecha_limite: string
  hora_limite: string | null
  tipo: string
  habilitado: number | boolean
}

export interface ClienteProcesoHitoUpdate {
  estado: string
  fecha_estado: string | null
  fecha_limite?: string
  hora_limite?: string | null
  habilitado?: number | boolean
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

export const getClienteProcesoHitoById = async (id: number) => {
  const response = await api.get<ClienteProcesoHito>(`/cliente-proceso-hitos/${id}`)
  return response.data
}

export const createClienteProcesoHito = async (clienteProcesoHito: Omit<ClienteProcesoHito, 'id'>) => {
  const response = await api.post<ClienteProcesoHito>('/cliente-proceso-hitos', clienteProcesoHito)
  return response.data
}

export const updateClienteProcesoHito = async (id: number, clienteProcesoHito: Omit<ClienteProcesoHitoUpdate, 'id'>) => {
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

export const getClienteProcesoHitosHabilitadosByProceso = async (idClienteProceso: number) => {
  const response = await api.get<ClienteProcesoHito[]>(`/cliente-proceso-hitos/cliente-proceso/${idClienteProceso}/habilitados`)
  return response.data
}

export const deshabilitarHitosPorHitoDesde = async (hitoId: number, fechaDesde: string) => {
  const response = await api.put(`/cliente-proceso-hitos/hito/${hitoId}/deshabilitar-desde`, {}, { params: { fecha_desde: fechaDesde } })
  return response.data
}


export interface MassUpdatePayload {
  hito_id: number
  empresa_ids: string[]
  nueva_fecha: string
  fecha_desde: string
}

export const updateMasivoHitos = async (payload: MassUpdatePayload) => {
  const response = await api.put('/cliente-proceso-hitos/update-masivo', payload)
  return response.data
}

export const deleteProcesoHitosByHito = async (hitoId: number) => {
  return await api.delete(`/proceso-hitos/hito/${hitoId}`)
}

export interface ClienteProcesoHitoResumido {
  id: number;
  fecha_limite: string;
  cliente: string;
  hito: string;
}

export interface ClienteProcesoHitosFechaResponse {
  anio: number;
  mes: number;
  total: number;
  items: ClienteProcesoHitoResumido[];
}

export const getClienteProcesoHitosPorFecha = async (
  anio: number,
  mes: number,
  page: number = 1,
  limit: number = 10,
  sortField: string = 'fecha_limite',
  sortDirection: 'asc' | 'desc' = 'asc'
) => {
  const params = new URLSearchParams({
    anio: anio.toString(),
    mes: mes.toString(),
    page: page.toString(),
    limit: limit.toString(),
    sort_by: sortField,
    order: sortDirection
  });
  const response = await api.get<ClienteProcesoHitosFechaResponse>(`/cliente-proceso-hitos/fecha?${params.toString()}`);
  return response.data;
}

export interface CumplimientoMasivoPayload {
  ids: number[]
  fecha: string
  hora: string
  observacion?: string
  usuario?: string
}

export const cumplimientoMasivo = async (payload: CumplimientoMasivoPayload) => {
  const response = await api.post('/cliente-proceso-hitos/cumplimiento-masivo', payload)
  return response.data
}
