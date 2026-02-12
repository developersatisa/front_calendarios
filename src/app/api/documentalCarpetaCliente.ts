import api from './axiosConfig'

export interface DocumentalCarpetaCliente {
    id: number
    cliente_id: string
    proceso_id: number
    carpeta_id: number
    nombre_carpeta: string
}

export interface DocumentalCarpetaClienteListResponse {
    carpetas: DocumentalCarpetaCliente[]
    total: number
}

// Obtener carpetas de cliente por cliente_id
export const getDocumentalCarpetaClienteByClienteId = async (
    clienteId: string,
    page?: number,
    limit?: number
) => {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())

    const response = await api.get<DocumentalCarpetaClienteListResponse>(`/documental-carpeta-cliente/cliente/${clienteId}?${params.toString()}`)
    return response.data
}
