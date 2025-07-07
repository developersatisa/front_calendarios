import api from './axiosConfig'

export interface Cliente {
  idcliente: string
  cif: string | null
  cif_empresa: string | null
  razsoc: string | null
  direccion: string | null
  localidad: string | null
  provincia: string | null
  cpostal: string | null
  codigop: string | null
  pais: string | null
  cif_factura: string | null
}

export interface ClientesResponse {
  clientes: Cliente[]
  total: number
}

export const getAllClientes = async (
  page?: number,
  limit?: number,
  sortField?: string,
  sortDirection?: 'asc' | 'desc'
) => {
  try {
    const params = new URLSearchParams()
    if (page && page > 0) params.append('page', String(page))
    if (limit && limit > 0) params.append('limit', String(limit))
    if (sortField) params.append('sort_field', sortField)
    if (sortDirection) params.append('sort_direction', sortDirection)

    // Si no se proporcionan parámetros, añadir limit=100 por defecto para el selector
    if (!page && !limit) {
      params.append('limit', '50')
    }

    console.log('Requesting clientes with params:', params.toString())
    const response = await api.get<ClientesResponse>('/clientes' + (params.toString() ? `?${params.toString()}` : ''))

    // En caso de que la respuesta no tenga la estructura esperada
    return {
      clientes: response.data?.clientes || [],
      total: response.data?.total || 0
    }
  } catch (error) {
    console.error('Error in getAllClientes:', error)
    // Devolver un objeto válido en caso de error
    return {
      clientes: [],
      total: 0
    }
  }
}

export const getClienteByNombre = async (nombre: string) => {
  const response = await api.get<Cliente>(`/clientes/nombre/${nombre}`)
  return response.data
}

export const getClienteByCIF = async (cif: string) => {
  const response = await api.get<Cliente>(`/clientes/cif/${cif}`)
  return response.data
}

export const getClienteById = async (id: string) => {
  const response = await api.get<Cliente>(`/clientes/${id}`)
  return response.data
}
