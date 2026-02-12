import api from './axiosConfig'

export interface DocumentalCarpetaDocumentoResponse {
    id?: number
    carpeta_id?: number
    nombre_documento?: string
    original_file_name?: string
    stored_file_name?: string
    autor?: string
    eliminado?: boolean
    fecha_creacion?: string
    fecha_actualizacion?: string
    // Legacy properties just in case
    success?: boolean
    message?: string
}

// Upload multiple documents to a specific folder (carpeta_id)
export const uploadDocumentalCarpetaDocumentos = async (
    carpetaId: number,
    files: File[],
    autor: string,
    codSubDepar: string
): Promise<DocumentalCarpetaDocumentoResponse> => {
    const formData = new FormData()
    formData.append('autor', autor)
    formData.append('codSubDepar', codSubDepar)

    files.forEach((file) => {
        formData.append('file', file)
    })

    const response = await api.post<DocumentalCarpetaDocumentoResponse>(
        `/documental-carpeta-documentos/upload/${carpetaId}`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    )

    return response.data
}

export interface DocumentalCarpetaDocumentosListResponse {
    documentos: DocumentalCarpetaDocumentoResponse[]
    total: number
}

export const getDocumentosByCarpetaId = async (
    carpetaId: number,
    page?: number,
    limit?: number
) => {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())

    const response = await api.get<DocumentalCarpetaDocumentosListResponse>(`/documental-carpeta-documentos/carpeta/${carpetaId}?${params.toString()}`)
    return response.data
}

// Descargar un documento por su id
export const descargarDocumentoCarpeta = async (idDocumento: number): Promise<Blob> => {
    const response = await api.get(`/documental-carpeta-documentos/descargar/${idDocumento}`, {
        responseType: 'blob'
    })
    return response.data
}

// Eliminar un documento por su id
export const eliminarDocumentoCarpeta = async (idDocumento: number) => {
    const response = await api.delete(`/documental-carpeta-documentos/${idDocumento}`)
    return response.data
}
