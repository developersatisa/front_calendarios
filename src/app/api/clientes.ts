import api from './axiosConfig'

export interface ConfiguracionAviso {
  id: number
  aviso_vence_hoy: boolean
  temporicidad_vence_hoy: number | null
  tiempo_vence_hoy: number | null
  hora_vence_hoy: string | null

  aviso_proximo_vencimiento: boolean
  temporicidad_proximo_vencimiento: number | null
  tiempo_proximo_vencimiento: number | null
  hora_proximo_vencimiento: string | null
  dias_proximo_vencimiento: number | null

  aviso_vencido: boolean
  temporicidad_vencido: number | null
  tiempo_vencido: number | null
  hora_vencido: string | null

  config_global: boolean
}

export type ConfiguracionAvisos = ConfiguracionAviso

export interface Departamento {
  ceco: string
  nombre: string
  configuracion?: ConfiguracionAviso | null
}

export interface Cliente {
  idcliente: string
  cif: string | null
  razsoc: string
  departamentos?: Departamento[]
  cif_empresa?: string | null
  direccion?: string | null
  localidad?: string | null
  provincia?: string | null
  cpostal?: string | null
  pais?: string | null
  codigop?: string | null
  cif_factura?: string | null
}

export interface ClientesResponse {
  clientes: Cliente[]
  total: number
  page: number
  limit: number
}

// --- API Functions ---

export const getClientesConDepartamentos = async (
  page: number = 1,
  limit: number = 10,
  sort_field: string = 'razsoc',
  sort_direction: string = 'asc',
  search?: string,
  ceco?: string
) => {
  const params: any = {
    page,
    limit,
    sort_field,
    sort_direction
  }
  if (search) params.search = search
  if (ceco) params.ceco = ceco

  const response = await api.get<ClientesResponse>('/clientes/departamentos', { params })
  return response.data
}

export const getAllClientes = async (
  page: number = 1,
  limit: number = 10,
  sort_field: string = 'razsoc',
  sort_direction: string = 'asc',
  search?: string
) => {
  const params: any = {
    page,
    limit,
    sort_field,
    sort_direction
  }
  if (search) params.search = search
  const response = await api.get<ClientesResponse>('/clientes', { params })
  return response.data
}

export const getClienteById = async (id: string | number) => {
  const response = await api.get<Cliente>(`/clientes/${id}`)
  return response.data
}

export const getClientesUsuario = async (
  email?: string,
  page?: number,
  limit?: number,
  search?: string,
  sortDirection?: string
) => {
  const params: any = {}
  if (email) params.email = email
  if (page) params.page = page
  if (limit) params.limit = limit
  if (search) params.search = search
  if (sortDirection) params.sort_direction = sortDirection

  const response = await api.get<ClientesResponse>('/clientes/usuario', { params })
  return response.data
}

export const getClientesPorHito = async (
  hitoId: string | number,
  page: number = 1,
  limit: number = 5,
  search: string = '',
  sort_field: string = 'razsoc',
  sort_direction: string = 'asc'
) => {
  const params = {
    page,
    limit,
    search,
    sort_field,
    sort_direction
  }
  const response = await api.get<ClientesResponse>(`/clientes/hito/${hitoId}`, { params })
  return response.data
}
