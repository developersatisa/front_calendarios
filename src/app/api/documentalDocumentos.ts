import api from './axiosConfig'

export interface DocumentalDocumento {
    id: number,
    cliente_id: string,
    categoria_id: number,
    nombre_documento: string,
    original_file_name: string,
    stored_file_name: string,
}

export interface DocumentalDocumentosResponse {
    documentos: DocumentalDocumento[],
    total: number
}

export interface CrearDocumentoRequest {
    cliente_id: string,
    categoria_id: number,
    nombre_documento: string,
    file: File
}

// Función para obtener documentos por cliente y categoría
export const getDocumentosByClienteAndCategoria = async (
    idCliente: string,
    idCategoria: number
): Promise<DocumentalDocumentosResponse> => {
    const response = await api.get(`/documental-documentos/cliente/${idCliente}/categoria/${idCategoria}`)
    return response.data
}

export const crearDocumento = async (data: CrearDocumentoRequest): Promise<DocumentalDocumento> => {
    const formData = new FormData()
    formData.append('cliente_id', data.cliente_id)
    formData.append('categoria_id', data.categoria_id.toString())
    formData.append('nombre_documento', data.nombre_documento)
    formData.append('file', data.file)

    const response = await api.post('/documental-documentos', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })

    return response.data
}

// Función para descargar un documento
export const descargarDocumento = async (idDocumento: number): Promise<Blob> => {
    const response = await api.get(`/documental-documentos/descargar/${idDocumento}`, {
        responseType: 'blob'
    })
    return response.data
}

// Función para eliminar un documento
export const eliminarDocumento = async (idDocumento: number) => {
    const response = await api.delete(`/documental-documentos/${idDocumento}`)
    return response.data
}
