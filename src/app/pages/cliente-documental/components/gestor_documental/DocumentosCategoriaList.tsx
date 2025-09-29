import React, { FC, useEffect, useState } from 'react'
import { Modal, Button, Table, Badge, Spinner, Alert } from 'react-bootstrap'
import { DocumentalDocumento, getDocumentosByClienteAndCategoria, descargarDocumento, eliminarDocumento } from '../../../../api/documentalDocumentos'
import { atisaStyles } from '../../../../styles/atisaStyles'

interface Props {
  show: boolean
  onHide: () => void
  categoriaId: number
  categoriaNombre: string
  clienteId: string
}

const DocumentosCategoriaList: FC<Props> = ({
  show,
  onHide,
  categoriaId,
  categoriaNombre,
  clienteId
}) => {
  const [documentos, setDocumentos] = useState<DocumentalDocumento[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [documentoToDelete, setDocumentoToDelete] = useState<DocumentalDocumento | null>(null)

  useEffect(() => {
    if (show && categoriaId && clienteId) {
      loadDocumentos()
    }
  }, [show, categoriaId, clienteId])

  const loadDocumentos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getDocumentosByClienteAndCategoria(clienteId, categoriaId)
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

  const handleDescargar = async (documento: DocumentalDocumento) => {
    try {
      setDownloadingId(documento.id)

      // Usar la función de la API para descargar el documento
      const blob = await descargarDocumento(documento.id)

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
      alert('Error al descargar el documento. Por favor, inténtalo de nuevo.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!documentoToDelete) return

    try {
      setDeletingId(documentoToDelete.id)
      await eliminarDocumento(documentoToDelete.id)
      setDocumentos(documentos.filter(doc => doc.id !== documentoToDelete.id))
      setShowDeleteConfirm(false)
      setDocumentoToDelete(null)
    } catch (err) {
      console.error('Error al eliminar documento:', err)
      alert('Error al eliminar el documento. Por favor, inténtalo de nuevo.')
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
          Documentos de: {categoriaNombre}
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
                                  <i className={`bi ${getFileIcon(documento.original_file_name)} fs-4`}></i>
                                </div>
                              </div>
                              <div>
                                <div className="fw-bold text-gray-900">
                                  {documento.original_file_name}
                                </div>
                              </div>
                            </div>
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

      {showDeleteConfirm && documentoToDelete && (
        <Modal show={showDeleteConfirm} onHide={handleDeleteCancel} centered>
          <Modal.Header
            style={{
              backgroundColor: '#dc3545',
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
              <i className="bi bi-trash-fill me-2" style={{ color: 'white' }}></i>
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
          <Modal.Body>
            ¿Estás seguro de que quieres eliminar el documento "{documentoToDelete.original_file_name}"?
            Esta acción no se puede deshacer.
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="outline-secondary" onClick={handleDeleteCancel}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} disabled={deletingId === documentoToDelete.id}>
              {deletingId === documentoToDelete.id ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Eliminar"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Modal>
  )
}

export default DocumentosCategoriaList
