import api from './axiosConfig'

export interface DocumentoCumplimientoResponse {
  id: number
  cumplimiento_id: number
  nombre_documento: string
  original_file_name: string
  stored_file_name: string
}

// Subir un documento para un cumplimiento
export const subirDocumentoCumplimiento = async (
  cumplimientoId: number,
  nombreDocumento: string,
  file: File,
  autor: string
) => {
  const formData = new FormData()
  formData.append('cumplimiento_id', cumplimientoId.toString())
  formData.append('nombre_documento', nombreDocumento)
  formData.append('file', file)
  formData.append('autor', autor)

  const response = await api.post<DocumentoCumplimientoResponse>('/documentos-cumplimiento', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// Verificar si un cumplimiento tiene documentos
export const tieneDocumentosCumplimiento = async (cumplimientoId: number): Promise<boolean> => {
  const response = await api.get<{ tiene_documentos: boolean }>(`/documentos-cumplimiento/cumplimiento/${cumplimientoId}`)
  return response.data.tiene_documentos || false
}

// Obtener documentos por cumplimiento
export const getDocumentosByCumplimiento = async (cumplimientoId: number) => {
  const response = await api.get<DocumentoCumplimientoResponse[]>(`/documentos-cumplimiento/cumplimiento/${cumplimientoId}`)
  return response.data
}

// Descargar documentos de un cumplimiento
export const descargarDocumentosCumplimiento = async (cumplimientoId: number): Promise<Blob> => {
  const response = await api.get(`/documentos-cumplimiento/cumplimiento/${cumplimientoId}/descargar`, {
    responseType: 'blob'
  })
  return response.data
}

// Eliminar un documento de cumplimiento
export const eliminarDocumentoCumplimiento = async (id: number) => {
  return await api.delete(`/documentos-cumplimiento/${id}`)
}
