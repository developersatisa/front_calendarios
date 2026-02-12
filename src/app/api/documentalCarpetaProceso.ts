import api from './axiosConfig'

export interface DocumentalCarpetaProceso {
    id: number
    proceso_id: number
    nombre: string
    descripcion: string
}

export interface DocumentalCarpetaProcesoCreate {
    proceso_id: number
    nombre: string
    descripcion: string
}

export interface DocumentalCarpetaProcesoUpdate {
    nombre: string
    descripcion: string
}

export interface DocumentalCarpetaProcesoResponse {
    carpetas: DocumentalCarpetaProceso[]
    total: number
}

// Obtener carpetas por proceso_id
export const getDocumentalCarpetaProcesoByProcesoId = async (
    procesoId: number,
    page?: number,
    limit?: number
) => {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())

    const response = await api.get<DocumentalCarpetaProcesoResponse>(`/documental-carpeta-proceso/proceso/${procesoId}?${params.toString()}`)
    return response.data
}

// Crear una nueva carpeta de proceso
export const createDocumentalCarpetaProceso = async (
    data: DocumentalCarpetaProcesoCreate
) => {
    const response = await api.post<DocumentalCarpetaProceso>('/documental-carpeta-proceso/', data)
    return response.data
}

// Actualizar una carpeta de proceso
export const updateDocumentalCarpetaProceso = async (
    id: number,
    data: DocumentalCarpetaProcesoUpdate
) => {
    const response = await api.put<DocumentalCarpetaProceso>(`/documental-carpeta-proceso/${id}`, data)
    return response.data
}

// Eliminar una carpeta de proceso (opcional, pero buena práctica tenerla)
export const deleteDocumentalCarpetaProceso = async (id: number) => {
    return await api.delete(`/documental-carpeta-proceso/${id}`)
}
