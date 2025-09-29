import { FC, useRef, useState, useEffect } from 'react'
import { Modal, Button, Form, ProgressBar, Alert } from 'react-bootstrap'
import { crearDocumento } from '../../../../api/documentalDocumentos'
import { atisaStyles } from '../../../../styles/atisaStyles'

interface Props {
  show: boolean
  onHide: () => void
  categoriaId: number
  categoriaNombre: string
  clienteId: string
  onUploadSuccess: () => void
}

// Tipo para el estado de subida de archivos
interface FileUploadStatus {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const CategorizarDocumentoModal: FC<Props> = ({ show, onHide, categoriaId, categoriaNombre, clienteId, onUploadSuccess }) => {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Estados para manejo de subida de archivos
  const [fileUploadStatuses, setFileUploadStatuses] = useState<FileUploadStatus[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showUploadResults, setShowUploadResults] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reiniciar formulario cuando se abre el modal
  useEffect(() => {
    if (show) {
      resetearFormulario()
    }
  }, [show])

  const resetearFormulario = () => {
    setFiles([])
    // Resetear estados de subida
    setFileUploadStatuses([])
    setUploadProgress(0)
    setShowUploadResults(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => {
        const allFiles = [...prev, ...newFiles]

        // Inicializar estados de subida para todos los archivos
        const newStatuses: FileUploadStatus[] = allFiles.map(file => ({
          file,
          status: 'pending'
        }))
        setFileUploadStatuses(newStatuses)
        setShowUploadResults(false)
        setUploadProgress(0)

        return allFiles
      })
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles(prev => {
        const allFiles = [...prev, ...newFiles]

        // Inicializar estados de subida para todos los archivos
        const newStatuses: FileUploadStatus[] = allFiles.map(file => ({
          file,
          status: 'pending'
        }))
        setFileUploadStatuses(newStatuses)
        setShowUploadResults(false)
        setUploadProgress(0)

        return allFiles
      })
    }
  }

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, index) => index !== indexToRemove)

      // Actualizar estados de subida
      const newStatuses: FileUploadStatus[] = newFiles.map((file, index) => {
        // Mantener los datos existentes si el archivo ya estaba
        const existingStatus = fileUploadStatuses.find(status => status.file === file)
        return existingStatus || {
          file,
          status: 'pending'
        }
      })
      setFileUploadStatuses(newStatuses)
      setShowUploadResults(false)
      setUploadProgress(0)

      return newFiles
    })
  }

  const handleFileSelectClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que haya al menos un archivo
    if (files.length === 0) {
      alert('Por favor selecciona al menos un archivo para subir')
      return
    }

    setLoading(true)
    try {
      // Subir archivos uno por uno con manejo de errores individual
      let uploadedFiles = 0
      let failedFiles = 0

      setShowUploadResults(true)

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileName = file.name

        // Actualizar estado del archivo actual a "uploading"
        setFileUploadStatuses(prev =>
          prev.map((status, index) =>
            index === i ? { ...status, status: 'uploading' } : status
          )
        )

        try {
          // Usar la nueva función crearDocumento del API
          await crearDocumento({
            id_cliente: clienteId,
            id_categoria: categoriaId,
            nombre_documento: fileName,
            file: file
          })
          uploadedFiles++

          // Marcar como exitoso
          setFileUploadStatuses(prev =>
            prev.map((status, index) =>
              index === i ? { ...status, status: 'success' } : status
            )
          )
        } catch (fileError) {
          failedFiles++
          console.error(`Error al subir archivo ${fileName}:`, fileError)

          // Marcar como error
          setFileUploadStatuses(prev =>
            prev.map((status, index) =>
              index === i ? {
                ...status,
                status: 'error',
                error: `Error al subir: ${fileError instanceof Error ? fileError.message : 'Error desconocido'}`
              } : status
            )
          )
        }

        // Actualizar progreso
        const progress = ((i + 1) / files.length) * 100
        setUploadProgress(progress)
      }

      // Mostrar resumen de la subida
      if (failedFiles > 0) {
        const message = uploadedFiles > 0
          ? `Se subieron ${uploadedFiles} archivos correctamente y ${failedFiles} fallaron.`
          : `Error: no se pudieron subir ${failedFiles} archivos.`

        if (uploadedFiles === 0) {
          console.warn(message)
          alert(message)
          return
        }
      }

      // Si llegamos aquí, al menos algunos archivos se subieron exitosamente
      onUploadSuccess()
      onHide()

      // Resetear el formulario usando la función centralizada
      resetearFormulario()
    } catch (err) {
      console.error('Error al categorizar documentos:', err)
      alert('Error al categorizar los documentos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
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
          <i className="bi bi-upload me-2" style={{ color: 'white' }}></i>
          Subir Documentos - {categoriaNombre}
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
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Form.Label className="fw-bold mb-3">Seleccionar archivos para categorizar</Form.Label>

            {/* Zona de Drag & Drop */}
            <div
              className={`border border-2 border-dashed rounded p-4 text-center position-relative ${dragActive ? 'border-primary bg-light' : 'border-secondary'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{ cursor: 'pointer', minHeight: '120px' }}
              onClick={handleFileSelectClick}
            >
              <div className="d-flex flex-column align-items-center justify-content-center h-100">
                <i className="bi bi-upload fs-1 text-muted mb-2"></i>
                <p className="text-muted mb-1">
                  Arrastra y suelta tus archivos aquí o haz clic para seleccionar
                </p>
                <small className="text-muted">
                  Puedes seleccionar múltiples archivos
                </small>
              </div>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                ref={fileInputRef}
                className="d-none"
              />
            </div>

            {/* Lista de archivos seleccionados */}
            {files.length > 0 && (
              <div className="mt-3">
                <h6 className="fw-bold mb-2">Archivos seleccionados ({files.length})</h6>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {files.map((file, index) => (
                    <div key={index} className="border rounded mb-2 p-3">
                      {/* Cabecera del archivo */}
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-file-earmark text-primary me-2"></i>
                          <div>
                            <div className="fw-semibold">{file.name}</div>
                            <small className="text-muted">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </small>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFile(index)
                          }}
                          title="Eliminar archivo"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Progreso y resultados de subida */}
          {showUploadResults && (
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Progreso de subida</h6>

              {/* Barra de progreso general */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="text-muted">Progreso general</small>
                  <small className="text-muted">{Math.round(uploadProgress)}%</small>
                </div>
                <ProgressBar
                  now={uploadProgress}
                  variant={uploadProgress === 100 ? "success" : "info"}
                  style={{ height: '6px' }}
                />
              </div>

              {/* Estado de cada archivo */}
              <div className="border rounded p-3" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {fileUploadStatuses.map((fileStatus, index) => (
                  <div key={index} className="d-flex align-items-center justify-content-between p-2 border-bottom">
                    <div className="d-flex align-items-center flex-grow-1">
                      <div className="me-3">
                        {fileStatus.status === 'pending' && (
                          <i className="bi bi-clock text-muted"></i>
                        )}
                        {fileStatus.status === 'uploading' && (
                          <div className="spinner-border spinner-border-sm text-primary" />
                        )}
                        {fileStatus.status === 'success' && (
                          <i className="bi bi-check-circle-fill text-success"></i>
                        )}
                        {fileStatus.status === 'error' && (
                          <i className="bi bi-x-circle-fill text-danger"></i>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{fileStatus.file.name}</div>
                        <div className="d-flex align-items-center">
                          <small className="text-muted me-2">
                            {(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB
                          </small>
                          {fileStatus.status === 'pending' && (
                            <small className="text-muted">Esperando...</small>
                          )}
                          {fileStatus.status === 'uploading' && (
                            <small className="text-primary">Subiendo...</small>
                          )}
                          {fileStatus.status === 'success' && (
                            <small className="text-success">✓ Subido correctamente</small>
                          )}
                          {fileStatus.status === 'error' && (
                            <small className="text-danger">✗ {fileStatus.error}</small>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen final */}
              {uploadProgress === 100 && (
                <div className="mt-3">
                  {fileUploadStatuses.filter(f => f.status === 'error').length === 0 ? (
                    <Alert variant="success" className="mb-0">
                      <i className="bi bi-check-circle me-2"></i>
                      Todos los archivos se subieron correctamente ({fileUploadStatuses.length} archivos)
                    </Alert>
                  ) : (
                    <Alert variant="warning" className="mb-0">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Se subieron {fileUploadStatuses.filter(f => f.status === 'success').length} de {fileUploadStatuses.length} archivos.
                      {fileUploadStatuses.filter(f => f.status === 'error').length} archivos fallaron.
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="secondary"
              onClick={onHide}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || files.length === 0}
            >
              {loading ? 'Subiendo archivos...' : 'Añadir Documentos'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

export default CategorizarDocumentoModal
