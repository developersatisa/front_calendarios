import api from './axiosConfig'

export interface DocumentalDocumento {
    id: number,
    id_cliente: string,
    id_categoria: number,
    nombre_documento: string,
    original_file_name: string,
    stored_file_name: string,
}

export interface DocumentalDocumentosResponse {
    documentos: DocumentalDocumento[],
    total: number
}

export interface CrearDocumentoRequest {
    id_cliente: string,
    id_categoria: number,
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
    formData.append('id_cliente', data.id_cliente)
    formData.append('id_categoria', data.id_categoria.toString())
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
