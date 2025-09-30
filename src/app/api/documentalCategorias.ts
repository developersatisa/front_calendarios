import api from './axiosConfig'

export interface DocumentalCategoria {
  id: number
  cliente_id: string
  nombre: string
}

export interface DocumentalCategoriaCreate {
  cliente_id: string
  nombre: string
}

export interface DocumentalCategoriasResponse {
  documental_categorias: DocumentalCategoria[]
  total: number
}

// Obtener todas las categorías de documentos con paginación y ordenamiento
export const getAllDocumentalCategorias = async (
  page?: number,
  limit?: number,
  sortField?: string,
  sortDirection?: 'asc' | 'desc'
) => {
  const params = new URLSearchParams()
  if (page && page > 0) params.append('page', String(page))
  if (limit && limit > 0) params.append('limit', String(limit))
  if (sortField) params.append('sort_field', sortField)
  if (sortDirection) params.append('sort_direction', sortDirection)

  const response = await api.get<DocumentalCategoriasResponse>(
    '/documental-categorias' + (params.toString() ? `?${params.toString()}` : '')
  )

  return {
    documental_categorias: response.data?.documental_categorias || [],
    total: response.data?.total || 0
  }
}

// Obtener categorías de documentos por clienteID
export const getDocumentalCategoriasByClienteId = async (idCliente: string) => {
  const response = await api.get<DocumentalCategoriasResponse>(`/documental-categorias/cliente/${idCliente}`)
  return {
    documental_categorias: response.data?.documental_categorias || [],
    total: response.data?.total || 0
  }
}

// Obtener una categoría de documento por ID
export const getDocumentalCategoriaById = async (id: number) => {
  const response = await api.get<DocumentalCategoriasResponse>(`/documental-categorias/${id}`)
  return {
    documental_categorias: response.data?.documental_categorias || [],
    total: response.data?.total || 0
  }
}

// Crear una nueva categoría de documento
export const createDocumentalCategoria = async (
  categoria: DocumentalCategoriaCreate
) => {
  const response = await api.post<DocumentalCategoria>('/documental-categorias', categoria)
  return response.data
}

// Actualizar una categoría de documento
export const updateDocumentalCategoria = async (
  id: number,
  categoria: Partial<DocumentalCategoriaCreate>
) => {
  const response = await api.put<DocumentalCategoria>(`/documental-categorias/${id}`, categoria)
  return response.data
}

// Eliminar una categoría de documento
export const deleteDocumentalCategoria = async (id: number) => {
  return await api.delete(`/documental-categorias/${id}`)
}
