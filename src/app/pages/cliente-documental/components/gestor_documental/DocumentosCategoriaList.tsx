import React, { FC, useEffect, useState, useRef, useMemo } from 'react'
import { Modal, Button, Table, Spinner, Alert, Tabs, Tab, ProgressBar } from 'react-bootstrap'
import CustomToast from '../../../../components/ui/CustomToast'
import SharedPagination from '../../../../components/pagination/SharedPagination'
import { DocumentalCarpetaDocumentoResponse, getDocumentosByCarpetaId, descargarDocumentoCarpeta, eliminarDocumentoCarpeta, uploadDocumentalCarpetaDocumentos } from '../../../../api/documentalCarpetaDocumentos'
import { atisaStyles, getTableHeaderStyles, getTableCellStyles } from '../../../../styles/atisaStyles'
import { useAuth } from '../../../../modules/auth/core/Auth'

interface Props {
  show: boolean
  onHide: () => void
  carpetaId: number
  carpetaNombre: string
  clienteId: string
}

interface FileUploadStatus {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const DocumentosCategoriaList: FC<Props> = ({
  show,
  onHide,
  carpetaId,
  carpetaNombre,
  clienteId
}) => {
  const { currentUser, auth } = useAuth()
  const [activeTab, setActiveTab] = useState('lista')

  // List States
  const [documentos, setDocumentos] = useState<DocumentalCarpetaDocumentoResponse[]>([])
  const [loadingList, setLoadingList] = useState<boolean>(false)
  const [errorList, setErrorList] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [documentoToDelete, setDocumentoToDelete] = useState<DocumentalCarpetaDocumentoResponse | null>(null)

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5 // Reducido para que quepa bien dentro del cuadro del modal

  // Upload States
  const [files, setFiles] = useState<File[]>([])
  const [loadingUpload, setLoadingUpload] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [fileUploadStatuses, setFileUploadStatuses] = useState<FileUploadStatus[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showUploadResults, setShowUploadResults] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Toast
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info')

  const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  useEffect(() => {
    if (show && carpetaId && clienteId) {
      loadDocumentos()
      setActiveTab('lista')
      resetearFormulario()
      setSearchTerm('')
      setCurrentPage(1)
    }
  }, [show, carpetaId, clienteId])

  // --- LISTADO LOGIC ---
  const loadDocumentos = async () => {
    try {
      setLoadingList(true)
      setErrorList(null)
      const response = await getDocumentosByCarpetaId(carpetaId)
      setDocumentos(response.documentos || [])
    } catch (err) {
      console.error('Error al cargar documentos:', err)
      setErrorList('Error al cargar los documentos de la categoría')
    } finally {
      setLoadingList(false)
    }
  }

  const handleDescargar = async (documento: DocumentalCarpetaDocumentoResponse) => {
    if (!documento.id || !documento.original_file_name) return
    try {
      setDownloadingId(documento.id)
      const blob = await descargarDocumentoCarpeta(documento.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = documento.original_file_name
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error al descargar documento:', err)
      showToastMessage('Error al descargar el documento.', 'error')
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

      // Ajustar la paginación si se elimina el último elemento de la página
      const currentPaginatedResults = paginatedDocumentos.length
      if (currentPaginatedResults === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1)
      }
    } catch (err) {
      console.error('Error al eliminar documento:', err)
      showToastMessage('Error al eliminar el documento.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf': return 'bi-file-pdf text-danger'
      case 'doc': case 'docx': return 'bi-file-word text-primary'
      case 'xls': case 'xlsx': return 'bi-file-excel text-success'
      case 'ppt': case 'pptx': return 'bi-file-ppt text-warning'
      case 'txt': return 'bi-file-text text-muted'
      case 'jpg': case 'jpeg': case 'png': case 'gif': return 'bi-file-image text-info'
      default: return 'bi-file-earmark text-secondary'
    }
  }

  // Derived State for Filtering & Pagination
  const filteredDocumentos = useMemo(() => {
    if (!searchTerm.trim()) return documentos
    const term = searchTerm.toLowerCase()
    return documentos.filter(doc =>
      (doc.original_file_name || '').toLowerCase().includes(term) ||
      (doc.autor || '').toLowerCase().includes(term)
    )
  }, [documentos, searchTerm])

  const paginatedDocumentos = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredDocumentos.slice(startIndex, startIndex + pageSize)
  }, [filteredDocumentos, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // --- UPLOAD LOGIC ---
  const getCurrentAutor = (): string => {
    if (auth?.api_token) {
      try {
        const payload = JSON.parse(atob(auth.api_token.split('.')[1]))
        return payload.numeross || payload.username || currentUser?.username || 'usuario'
      } catch (error) {
        console.warn('Error decodificando token JWT:', error)
      }
    }
    return currentUser?.username || 'usuario'
  }

  const getCurrentCodSubDepar = (): string => {
    if (auth?.api_token) {
      try {
        const payload = JSON.parse(atob(auth.api_token.split('.')[1]))
        return payload.codSubDepar || ''
      } catch (error) {
        console.warn('Error token:', error)
      }
    }
    return ''
  }

  const resetearFormulario = () => {
    setFiles([])
    setFileUploadStatuses([])
    setUploadProgress(0)
    setShowUploadResults(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files))
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files))
    }
  }

  const addFiles = (newFiles: File[]) => {
    setFiles(prev => {
      const allFiles = [...prev, ...newFiles]
      const newStatuses: FileUploadStatus[] = allFiles.map(file => ({
        file, status: 'pending'
      }))
      setFileUploadStatuses(newStatuses)
      setShowUploadResults(false)
      setUploadProgress(0)
      return allFiles
    })
  }

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, index) => index !== indexToRemove)
      const newStatuses: FileUploadStatus[] = newFiles.map(file => {
        const existingStatus = fileUploadStatuses.find(status => status.file === file)
        return existingStatus || { file, status: 'pending' }
      })
      setFileUploadStatuses(newStatuses)
      return newFiles
    })
  }

  const handleSubmitUpload = async () => {
    if (files.length === 0) {
      showToastMessage('Por favor selecciona al menos un archivo', 'warning')
      return
    }

    setLoadingUpload(true)
    setShowUploadResults(true)
    let uploadedFiles = 0
    let failedFiles = 0

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        setFileUploadStatuses(prev => prev.map((status, idx) =>
          idx === i ? { ...status, status: 'uploading' } : status
        ))

        try {
          const result = await uploadDocumentalCarpetaDocumentos(carpetaId, [file], getCurrentAutor(), getCurrentCodSubDepar())

          if (result.success === false) {
            throw new Error(result.message || 'Error al subir')
          }

          uploadedFiles++
          setFileUploadStatuses(prev => prev.map((status, idx) =>
            idx === i ? { ...status, status: 'success' } : status
          ))
        } catch (fileError) {
          failedFiles++
          setFileUploadStatuses(prev => prev.map((status, idx) =>
            idx === i ? {
              ...status,
              status: 'error',
              error: fileError instanceof Error ? fileError.message : 'Error desconocido'
            } : status
          ))
        }
        setUploadProgress(((i + 1) / files.length) * 100)
      }

      if (uploadedFiles > 0) {
        showToastMessage(`Se subieron ${uploadedFiles} archivos correctamente`, 'success')
        loadDocumentos()

        setTimeout(() => {
          setActiveTab('lista')
          resetearFormulario()
        }, 1500)
      }

    } catch (err) {
      showToastMessage('Error general al subir documentos', 'error')
    } finally {
      setLoadingUpload(false)
    }
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      backdrop="static"
      keyboard={false}
      style={{
        fontFamily: atisaStyles.fonts.secondary
      }}
    >
      <Modal.Header
        style={{
          background: 'linear-gradient(135deg, #00505c 0%, #007b8a 100%)',
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
          Carpeta: {carpetaNombre}
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
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || 'lista')}
          className="px-4 pt-3 border-bottom"
          style={{
            fontFamily: atisaStyles.fonts.secondary,
            fontWeight: '600'
          }}
        >
          <Tab eventKey="lista" title={<><i className="bi bi-list-ul me-2"></i>Documentos</>}>
            <div className="p-4" style={{ minHeight: '300px' }}>
              {loadingList ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <span className="ms-2">Cargando documentos...</span>
                </div>
              ) : errorList ? (
                <Alert variant="danger" className="m-3">
                  <Alert.Heading>Error</Alert.Heading>
                  <p>{errorList}</p>
                  <Button variant="outline-danger" onClick={loadDocumentos}>Reintentar</Button>
                </Alert>
              ) : (
                <>
                  {(!documentos || documentos.length === 0) ? (
                    <div className="text-center py-5">
                      <i className="bi bi-folder-x fs-1 text-muted mb-3"></i>
                      <h5 className="text-muted">No hay documentos en esta categoría</h5>
                      <p className="text-muted small">Haz clic en la pestaña "Subir Documentos" para añadir nuevos archivos.</p>
                      <Button variant="primary" onClick={() => setActiveTab('subir')} size="sm" className="mt-2" style={{ backgroundColor: atisaStyles.colors.accent, borderColor: atisaStyles.colors.accent }}>
                        Subir Documentos
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Search Bar & Counter */}
                      <div className='d-flex align-items-center position-relative my-1 mb-4'>
                        <i
                          className='bi bi-search position-absolute'
                          style={{
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: atisaStyles.colors.primary,
                            fontSize: '16px',
                            zIndex: 10
                          }}
                        ></i>
                        <input
                          type='text'
                          className='form-control form-control-solid ps-14'
                          placeholder='Buscar por nombre o autor...'
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{
                            border: `2px solid ${atisaStyles.colors.light}`,
                            borderRadius: '8px',
                            fontFamily: atisaStyles.fonts.secondary,
                            fontSize: '14px',
                            paddingLeft: '48px',
                            height: '48px',
                            width: '100%',
                            maxWidth: '400px'
                          }}
                        />
                      </div>

                      {filteredDocumentos.length === 0 ? (
                        <div className="text-center py-5 border rounded bg-light border-dashed">
                          <i className="bi bi-search fs-1 text-muted mb-3"></i>
                          <h6 className="text-muted">No se encontraron documentos</h6>
                          <p className="text-muted small mb-0">Intenta con otro término de búsqueda.</p>
                        </div>
                      ) : (
                        <>
                          <div className='table-responsive' style={{ margin: 0, borderRadius: '12px', border: `1px solid ${atisaStyles.colors.light}` }}>
                            <table
                              className='table align-middle table-row-dashed fs-6 gy-5'
                              style={{
                                fontFamily: atisaStyles.fonts.secondary,
                                borderCollapse: 'separate',
                                borderSpacing: '0',
                                margin: 0,
                                width: '100%'
                              }}
                            >
                              <thead>
                                <tr
                                  className='text-start fw-bold fs-7 text-uppercase gs-0'
                                  style={{
                                    backgroundColor: atisaStyles.colors.light,
                                    color: atisaStyles.colors.primary
                                  }}
                                >
                                  <th style={{ ...getTableHeaderStyles(), borderTopLeftRadius: '12px' }}>
                                    <i className="bi bi-file-earmark me-1"></i>Documento
                                  </th>
                                  <th style={getTableHeaderStyles()}>
                                    <i className="bi bi-calendar-check me-1"></i>Fecha Creación
                                  </th>
                                  <th style={getTableHeaderStyles()}>
                                    <i className="bi bi-person me-1"></i>Autor
                                  </th>
                                  <th className="text-center" style={{ ...getTableHeaderStyles(), borderTopRightRadius: '12px' }}>
                                    <i className="bi bi-gear me-1"></i>Acciones
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedDocumentos.map((documento, index) => (
                                  <tr
                                    key={documento.id}
                                    style={{
                                      backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                                      e.currentTarget.style.transform = 'translateY(-1px)'
                                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 80, 92, 0.1)'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa'
                                      e.currentTarget.style.transform = 'translateY(0)'
                                      e.currentTarget.style.boxShadow = 'none'
                                    }}
                                  >
                                    <td style={{ ...getTableCellStyles(), borderBottomLeftRadius: index === paginatedDocumentos.length - 1 ? '12px' : '0' }}>
                                      <div className="d-flex align-items-center">
                                        <div className="symbol symbol-35px me-3">
                                          <div className="symbol-label bg-light-gray-200">
                                            <i className={`bi ${getFileIcon(documento.original_file_name || '')} fs-4`}></i>
                                          </div>
                                        </div>
                                        <div className="fw-bold text-gray-900" style={{ wordBreak: 'break-word', maxWidth: '300px' }}>
                                          {documento.original_file_name}
                                        </div>
                                      </div>
                                    </td>
                                    <td style={getTableCellStyles()}>
                                      {documento.fecha_creacion ? new Date(documento.fecha_creacion).toLocaleString() : '-'}
                                    </td>
                                    <td style={getTableCellStyles()}>{documento.autor || '-'}</td>
                                    <td className="text-center" style={{ ...getTableCellStyles(), borderBottomRightRadius: index === paginatedDocumentos.length - 1 ? '12px' : '0' }}>
                                      <div className="d-flex gap-2 justify-content-center">
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          title="Descargar documento"
                                          onClick={() => handleDescargar(documento)}
                                          disabled={downloadingId === documento.id}
                                          style={{ borderColor: atisaStyles.colors.primary, color: atisaStyles.colors.primary }}
                                          onMouseEnter={(e) => {
                                            if (downloadingId !== documento.id) {
                                              e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                              e.currentTarget.style.color = 'white'
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (downloadingId !== documento.id) {
                                              e.currentTarget.style.backgroundColor = 'transparent'
                                              e.currentTarget.style.color = atisaStyles.colors.primary
                                            }
                                          }}
                                        >
                                          {downloadingId === documento.id ? <Spinner animation="border" size="sm" /> : <i className="bi bi-download"></i>}
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
                                          {deletingId === documento.id ? <Spinner animation="border" size="sm" /> : <i className="bi bi-trash"></i>}
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                          </div>

                          {/* Pagination Footer */}
                          {filteredDocumentos.length > 0 && (
                            <div
                              className="mt-4 d-flex justify-content-between align-items-center flex-wrap"
                            >
                              <div className="text-gray-600 fs-7" style={{ fontFamily: atisaStyles.fonts.secondary }}>
                                Mostrando <span className="fw-bold text-dark">{((currentPage - 1) * pageSize) + 1}</span> - <span className="fw-bold text-dark">{Math.min(currentPage * pageSize, filteredDocumentos.length)}</span> de <span className="fw-bold text-dark">{filteredDocumentos.length}</span> registros
                              </div>

                              <SharedPagination
                                currentPage={currentPage}
                                totalItems={filteredDocumentos.length}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </Tab>

          <Tab eventKey="subir" title={<><i className="bi bi-upload me-2"></i>Subir Documentos</>}>
            <div className="p-4" style={{ minHeight: '300px' }}>
              <div
                className={`border border-2 border-dashed rounded p-4 text-center position-relative ${dragActive ? 'border-primary bg-light' : 'border-secondary'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{ cursor: 'pointer', minHeight: '120px', transition: 'all 0.3s ease' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="d-flex flex-column align-items-center justify-content-center h-100">
                  <i className="bi bi-cloud-arrow-up fs-1 text-muted mb-2"></i>
                  <p className="text-muted mb-1 fw-bold">Arrastra y suelta tus archivos aquí o haz clic para seleccionar</p>
                  <small className="text-muted">Múltiples archivos permitidos</small>
                </div>
                <input type="file" multiple onChange={handleFileChange} ref={fileInputRef} className="d-none" />
              </div>

              {files.length > 0 && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0">Archivos seleccionados ({files.length})</h6>
                    <Button variant="primary" size="sm" onClick={handleSubmitUpload} disabled={loadingUpload} style={{ backgroundColor: atisaStyles.colors.primary, borderColor: atisaStyles.colors.primary }}>
                      {loadingUpload ? (
                        <><Spinner animation="border" size="sm" className="me-2" /> Subiendo...</>
                      ) : (
                        <><i className="bi bi-upload me-2"></i> Subir Archivos</>
                      )}
                    </Button>
                  </div>

                  <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="border rounded p-2">
                    {files.map((file, index) => (
                      <div key={index} className="d-flex align-items-center justify-content-between p-2 border-bottom">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-file-earmark text-primary me-2"></i>
                          <div>
                            <div className="fw-semibold" style={{ fontSize: '14px' }}>{file.name}</div>
                            <small className="text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                          </div>
                        </div>
                        {!loadingUpload && (
                          <Button variant="link" className="text-danger p-0 border-0" onClick={(e) => { e.stopPropagation(); removeFile(index); }}>
                            <i className="bi bi-trash"></i>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress and status */}
              {showUploadResults && (
                <div className="mt-4">
                  <div className="mb-2 d-flex justify-content-between">
                    <small className="text-muted fw-bold">Progreso</small>
                    <small className="text-muted">{Math.round(uploadProgress)}%</small>
                  </div>
                  <ProgressBar now={uploadProgress} variant={uploadProgress === 100 ? "success" : "info"} style={{ height: '8px' }} />

                  <div className="mt-3 border rounded p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {fileUploadStatuses.map((fStat, i) => (
                      <div key={i} className="d-flex align-items-center mb-2 small border-bottom pb-1">
                        {fStat.status === 'pending' && <><i className="bi bi-clock text-muted me-2"></i> <span className="text-muted">{fStat.file.name} (Esperando)</span></>}
                        {fStat.status === 'uploading' && <><Spinner animation="border" size="sm" className="text-primary me-2" /> <span className="text-primary">{fStat.file.name} (Subiendo)</span></>}
                        {fStat.status === 'success' && <><i className="bi bi-check-circle-fill text-success me-2"></i> <span className="text-success">{fStat.file.name} (Subido)</span></>}
                        {fStat.status === 'error' && <><i className="bi bi-x-circle-fill text-danger me-2"></i> <span className="text-danger">{fStat.file.name} - {fStat.error}</span></>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>

      <Modal.Footer
        style={{
          backgroundColor: '#f8f9fa',
          border: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '20px 24px'
        }}
      >
        <div className="d-flex w-100 justify-content-end">
          <Button
            variant="secondary"
            onClick={onHide}
            disabled={loadingUpload}
            style={{
              backgroundColor: 'white',
              color: atisaStyles.colors.primary,
              border: `2px solid ${atisaStyles.colors.primary}`,
              borderRadius: '8px',
              fontFamily: atisaStyles.fonts.secondary,
              fontWeight: '600',
              padding: '10px 20px',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              minWidth: '120px'
            }}
          >
            Cerrar
          </Button>
        </div>
      </Modal.Footer>

      {/* MODAL DE CONFIRMACIÓN ELIMINAR */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered backdrop="static" style={{ zIndex: 10001 }}>
        <Modal.Header style={{ backgroundColor: '#dc3545', color: 'white', border: 'none' }}>
          <Modal.Title className="fs-5"><i className="bi bi-trash-fill me-2"></i>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p>¿Estás seguro de que quieres eliminar el documento <strong>"{documentoToDelete?.original_file_name}"</strong>?</p>
          <p className="text-danger mb-0 fw-bold">Esta acción no se puede deshacer.</p>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deletingId !== null}>Cancelar</Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={deletingId !== null}>
            {deletingId !== null ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="bi bi-trash me-2"></i>}
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      <CustomToast show={showToast} onClose={() => setShowToast(false)} message={toastMessage} type={toastType} delay={5000} />
    </Modal>
  )
}

export default DocumentosCategoriaList
