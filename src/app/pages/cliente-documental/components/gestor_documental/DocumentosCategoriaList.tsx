import React, { FC, useEffect, useState } from 'react'
import { Modal, Button, Table, Badge, Spinner, Alert } from 'react-bootstrap'
import CustomToast from '../../../../components/ui/CustomToast'
import { DocumentalCarpetaDocumentoResponse, getDocumentosByCarpetaId, descargarDocumentoCarpeta, eliminarDocumentoCarpeta } from '../../../../api/documentalCarpetaDocumentos'
import { atisaStyles } from '../../../../styles/atisaStyles'

interface Props {
  show: boolean
  onHide: () => void
  carpetaId: number
  carpetaNombre: string
  clienteId: string
}

const DocumentosCategoriaList: FC<Props> = ({
  show,
  onHide,
  carpetaId,
  carpetaNombre,
  clienteId
}) => {
  const [documentos, setDocumentos] = useState<DocumentalCarpetaDocumentoResponse[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [documentoToDelete, setDocumentoToDelete] = useState<DocumentalCarpetaDocumentoResponse | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info')

  // Función auxiliar para mostrar toasts
  const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  useEffect(() => {
    if (show && carpetaId && clienteId) {
      loadDocumentos()
    }
  }, [show, carpetaId, clienteId])

  const loadDocumentos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getDocumentosByCarpetaId(carpetaId)
      setDocumentos(response.documentos || [])
    } catch (err) {
      console.error('Error al cargar documentos:', err)
      setError('Error al cargar los documentos de la categoría')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadDocumentos()
  }

  const handleDescargar = async (documento: DocumentalCarpetaDocumentoResponse) => {
    if (!documento.id || !documento.original_file_name) return
    try {
      setDownloadingId(documento.id)

      // Usar la función de la API para descargar el documento
      const blob = await descargarDocumentoCarpeta(documento.id)

      // Crear URL del blob
      const url = window.URL.createObjectURL(blob)

      // Crear enlace temporal para descarga
      const link = document.createElement('a')
      link.href = url
      link.download = documento.original_file_name
      link.style.display = 'none'

      // Agregar al DOM, hacer clic y limpiar
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Liberar la URL del blob
      window.URL.revokeObjectURL(url)

    } catch (err) {
      console.error('Error al descargar documento:', err)
      // Aquí podrías mostrar un toast o alert de error
      showToastMessage('Error al descargar el documento. Por favor, inténtalo de nuevo.', 'error')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!documentoToDelete || !documentoToDelete.id) return

    try {
      setDeletingId(documentoToDelete.id)
      await eliminarDocumentoCarpeta(documentoToDelete.id)
      setDocumentos(documentos.filter(doc => doc.id !== documentoToDelete.id))
      setShowDeleteConfirm(false)
      setDocumentoToDelete(null)
      showToastMessage('Documento eliminado correctamente', 'success')
    } catch (err) {
      console.error('Error al eliminar documento:', err)
      showToastMessage('Error al eliminar el documento. Por favor, inténtalo de nuevo.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setDocumentoToDelete(null)
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()

    switch (extension) {
      case 'pdf':
        return 'bi-file-pdf text-danger'
      case 'doc':
      case 'docx':
        return 'bi-file-word text-primary'
      case 'xls':
      case 'xlsx':
        return 'bi-file-excel text-success'
      case 'ppt':
      case 'pptx':
        return 'bi-file-ppt text-warning'
      case 'txt':
        return 'bi-file-text text-muted'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'bi-file-image text-info'
      default:
        return 'bi-file-earmark text-secondary'
    }
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      backdrop="static"
    >
      <Modal.Header
        style={{
          backgroundColor: atisaStyles.colors.primary,
          color: 'white',
          border: 'none',
          borderRadius: '12px 12px 0 0',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Modal.Title
          style={{
            fontFamily: atisaStyles.fonts.primary,
            fontWeight: 'bold',
            color: 'white',
            fontSize: '1.5rem',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <i className="bi bi-folder-fill me-2" style={{ color: 'white' }}></i>
          Documentos de: {carpetaNombre}
        </Modal.Title>
        <div
          className='btn btn-icon btn-sm'
          onClick={onHide}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <i className="bi bi-x" style={{ color: 'white', fontSize: '16px' }}></i>
        </div>
      </Modal.Header>

      <Modal.Body className="p-0">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Cargando documentos...</span>
          </div>
        ) : error ? (
          <Alert variant="danger" className="m-3">
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={handleRefresh}>
              Reintentar
            </Button>
          </Alert>
        ) : (
          <div className="p-3">
            {(!documentos || documentos.length === 0) ? (
              <div className="text-center py-5">
                <i className="bi bi-folder-x fs-1 text-muted mb-3"></i>
                <h5 className="text-muted">No hay documentos en esta categoría</h5>
                <p className="text-muted small">
                  Esta categoría no contiene documentos aún.
                </p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0">
                          <i className="bi bi-file-earmark me-1"></i>
                          Documento
                        </th>
                        <th className="border-0">
                          <i className="bi bi-calendar-check me-1"></i>
                          Fecha Creación
                        </th>
                        <th className="border-0">
                          <i className="bi bi-person me-1"></i>
                          Autor
                        </th>
                        <th className="border-0 text-center">
                          <i className="bi bi-gear me-1"></i>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(documentos || []).map((documento, index) => (
                        <tr key={documento.id} className="align-middle">
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="symbol symbol-35px me-3">
                                <div className="symbol-label bg-light-gray-200">
                                  <i className={`bi ${getFileIcon(documento.original_file_name || '')} fs-4`}></i>
                                </div>
                              </div>
                              <div>
                                <div className="fw-bold text-gray-900">
                                  {documento.original_file_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="align-middle">
                            {documento.fecha_creacion ? new Date(documento.fecha_creacion).toLocaleString() : '-'}
                          </td>
                          <td className="align-middle">
                            {documento.autor || '-'}
                          </td>

                          <td className="text-center">
                            <div className="d-flex gap-1 justify-content-center">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                title="Descargar documento"
                                onClick={() => handleDescargar(documento)}
                                disabled={downloadingId === documento.id}
                              >
                                {downloadingId === documento.id ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  <i className="bi bi-download"></i>
                                )}
                              </Button>

                              <Button
                                variant="outline-danger"
                                size="sm"
                                title="Eliminar documento"
                                onClick={() => {
                                  setDocumentoToDelete(documento)
                                  setShowDeleteConfirm(true)
                                }}
                                disabled={deletingId === documento.id}
                              >
                                {deletingId === documento.id ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  <i className="bi bi-trash"></i>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-light">
        <div className="d-flex justify-content-between w-100">
          <div className="text-muted small">
          </div>
          <Button variant="secondary" onClick={onHide}>
            Cerrar
          </Button>
        </div>
      </Modal.Footer>

      <Modal
        show={showDeleteConfirm}
        onHide={handleDeleteCancel}
        centered
        backdrop="static"
        style={{ zIndex: 10001 }}
      >
        <Modal.Header
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '12px 12px 0 0',
            padding: '20px 24px'
          }}
        >
          <Modal.Title
            style={{
              fontFamily: atisaStyles.fonts.primary,
              fontWeight: 'bold',
              color: 'white',
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <i className="bi bi-trash-fill" style={{ color: 'white' }}></i>
            Confirmar eliminación
          </Modal.Title>
          <div
            className='btn btn-icon btn-sm'
            onClick={handleDeleteCancel}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="bi bi-x text-white"></i>
          </div>
        </Modal.Header>
        <Modal.Body style={{ padding: '28px 24px' }}>
          <div className="d-flex align-items-start gap-3">
            <div
              style={{
                backgroundColor: '#f8d7da',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <i className="bi bi-exclamation-triangle-fill text-danger fs-4"></i>
            </div>
            <div>
              <p
                style={{
                  fontFamily: atisaStyles.fonts.secondary,
                  color: atisaStyles.colors.dark,
                  margin: 0,
                  lineHeight: '1.6',
                  fontSize: '15px'
                }}
              >
                ¿Estás seguro de que quieres eliminar el documento <strong>"{documentoToDelete?.original_file_name}"</strong>?
                <br /><br />
                <span className="text-danger fw-bold">Esta acción no se puede deshacer.</span>
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer
          style={{
            border: 'none',
            padding: '20px 24px',
            backgroundColor: '#f8f9fa',
            borderRadius: '0 0 12px 12px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <Button
            variant="secondary"
            onClick={handleDeleteCancel}
            disabled={deletingId !== null}
            style={{ borderRadius: '8px' }}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={deletingId !== null}
            style={{ borderRadius: '8px' }}
          >
            {deletingId !== null ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Eliminando...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Eliminar
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Custom Toast */}
      <CustomToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message={toastMessage}
        type={toastType}
        delay={5000}
      />
    </Modal>
  )
}

export default DocumentosCategoriaList
