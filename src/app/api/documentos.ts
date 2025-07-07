import api from './axiosConfig'

export interface DocumentoResponse {
  id: number
  nombre_documento: string
  cliente_proceso_hito_id: number
  fecha_subida: string
  url?: string
}

// Subir un documento para un cliente proceso hito
export const subirDocumento = async (
  idClienteProcesoHito: number,
  nombreDocumento: string,
  file: File
) => {
  const formData = new FormData()
  formData.append('id_cliente_proceso_hito', idClienteProcesoHito.toString())
  formData.append('nombre_documento', nombreDocumento)
  formData.append('file', file)

  const response = await api.post<DocumentoResponse>('/documentos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// Obtener documentos por cliente proceso hito
export const getDocumentosByClienteProcesoHito = async (idClienteProcesoHito: number) => {
  const response = await api.get<DocumentoResponse[]>(`/documentos/cliente-proceso-hito/${idClienteProcesoHito}`)
  return response.data
}

// Eliminar un documento
export const eliminarDocumento = async (id: number) => {
  return await api.delete(`/documentos/${id}`)
}
