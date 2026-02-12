import { FC, useRef, useState, useEffect } from 'react'
import { Modal, Button, Form, Accordion, ProgressBar, Alert } from 'react-bootstrap'
import CustomToast from '../../../../components/ui/CustomToast'
import { updateClienteProcesoHito, getClienteProcesoHitoById } from '../../../../api/clienteProcesoHitos'
import { subirDocumentoCumplimiento } from '../../../../api/documentosCumplimiento'
import { createClienteProcesoHitoCumplimiento } from '../../../../api/clienteProcesoHitoCumplimientos'
import { atisaStyles } from '../../../../styles/atisaStyles'
import { useAuth } from '../../../../modules/auth/core/Auth'

interface Props {
  show: boolean
  onHide: () => void
  idClienteProcesoHito: number
  nombreDocumento: string
  onUploadSuccess: () => void
  estado?: string
}

// Tipo para el estado de subida de archivos
interface FileUploadStatus {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const CumplimentarHitoModal: FC<Props> = ({ show, onHide, idClienteProcesoHito, nombreDocumento, onUploadSuccess, estado }) => {
  const { currentUser, auth } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [incluirDocumento, setIncluirDocumento] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info')
  const [fechaCumplimiento, setFechaCumplimiento] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [fechaEditable, setFechaEditable] = useState(false)
  const [horaCumplimiento, setHoraCumplimiento] = useState(() => {
    const now = new Date()
    return now.toTimeString().slice(0, 5) // Formato HH:MM
  })
  const [horaEditable, setHoraEditable] = useState(false)
  const [observacion, setObservacion] = useState('')
  const [dragActive, setDragActive] = useState(false)

  // Estados para manejo de subida de archivos
  const [fileUploadStatuses, setFileUploadStatuses] = useState<FileUploadStatus[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showUploadResults, setShowUploadResults] = useState(false)

  // Función auxiliar para mostrar toasts
  const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  // Función para obtener el identificador del usuario actual (numeross o username)
  const getCurrentUsername = (): string => {
    // Intentar extraer numeross del token JWT (prioridad según requerimiento)
    if (auth?.api_token) {
      try {
        const payload = JSON.parse(atob(auth.api_token.split('.')[1]))
        if (payload.numeross) return payload.numeross
        if (payload.username) return payload.username
        if (payload.sub) return payload.sub
      } catch (error) {
        console.warn('Error decodificando token JWT:', error)
      }
    }

    // Fallback al currentUser
    if (currentUser?.username) {
      return currentUser.username
    }

    // Fallback por defecto
    return 'usuario'
  }

  // Función para obtener el codSubDepar del token JWT
  const getCurrentCodSubDepar = (): string | undefined => {
    if (auth?.api_token) {
      try {
        const payload = JSON.parse(atob(auth.api_token.split('.')[1]))
        return payload.codSubDepar
      } catch (error) {
        console.warn('Error decodificando token JWT para codSubDepar:', error)
      }
    }
    return undefined
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const isFinalized = estado === 'Finalizado'

  // Reiniciar formulario cuando se abre el modal
  useEffect(() => {
    if (show) {
      resetearFormulario()
    }
  }, [show])

  const resetearFormulario = () => {
    setIncluirDocumento(false)
    setFechaEditable(false)
    setHoraEditable(false)
    setFiles([])
    setObservacion('')
    const now = new Date()
    setHoraCumplimiento(now.toTimeString().slice(0, 5))
    const today = new Date()
    setFechaCumplimiento(today.toISOString().split('T')[0])

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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setFechaEditable(checked)
    if (!checked) {
      // Si se desmarca, restaurar fecha actual
      const today = new Date()
      setFechaCumplimiento(today.toISOString().split('T')[0])
    }
  }

  const handleHoraCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setHoraEditable(checked)
    if (!checked) {
      // Si se desmarca, restaurar hora actual
      const now = new Date()
      setHoraCumplimiento(now.toTimeString().slice(0, 5))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let fechaActual = new Date();
    let fechaCumplimientoDate = new Date(fechaCumplimiento);
    if (fechaCumplimientoDate > fechaActual) {
      showToastMessage('La fecha de cumplimiento no puede ser mayor a la fecha actual', 'warning')
      return
    }

    // Validar hora si la fecha es hoy
    const hoy = new Date();
    const esHoy = fechaCumplimientoDate.toDateString() === hoy.toDateString();

    if (esHoy) {
      const horaActual = hoy.toTimeString().slice(0, 5); // Formato HH:MM
      const [horaActualH, horaActualM] = horaActual.split(':').map(Number);
      const [horaCumplimientoH, horaCumplimientoM] = horaCumplimiento.split(':').map(Number);

      const minutosActuales = horaActualH * 60 + horaActualM;
      const minutosCumplimiento = horaCumplimientoH * 60 + horaCumplimientoM;

      if (minutosCumplimiento > minutosActuales) {
        showToastMessage('La hora de cumplimiento no puede ser superior a la hora actual cuando es la fecha actual.', 'warning')
        return
      }
    }

    // Validar que si se va a incluir documento, haya al menos un archivo
    if (incluirDocumento && files.length === 0) {
      showToastMessage('Por favor selecciona al menos un archivo para subir', 'warning')
      return
    }

    // Validar que si se edita la fecha de cumplimiento, las observaciones sean obligatorias
    if (fechaEditable && (!observacion || observacion.trim() === '')) {
      showToastMessage('Las observaciones son obligatorias cuando se edita la fecha de cumplimiento', 'warning')
      return
    }

    setLoading(true)
    try {
      // Primero actualizar el estado del hito
      await updateClienteProcesoHito(idClienteProcesoHito, {
        estado: 'Finalizado',
        fecha_estado: new Date().toISOString()
      })

      // Crear el cumplimiento primero para obtener el cumplimiento_id
      const cumplimientoCreado = await createClienteProcesoHitoCumplimiento({
        cliente_proceso_hito_id: idClienteProcesoHito,
        fecha: fechaCumplimiento,
        hora: horaCumplimiento,
        observacion: observacion || undefined,
        usuario: getCurrentUsername(),
        codSubDepar: getCurrentCodSubDepar()
      })

      // Si se incluyen documentos, subirlos uno por uno con manejo de errores individual
      let uploadedFiles = 0
      let failedFiles = 0

      if (incluirDocumento && files.length > 0 && cumplimientoCreado.id) {
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
            await subirDocumentoCumplimiento(cumplimientoCreado.id, fileName, file, getCurrentUsername())
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
            // Si ningún archivo se subió, mostrar error pero continuar con el proceso
            console.warn(message)
          }
        }
      }

      onUploadSuccess()
      onHide()

      // Resetear el formulario usando la función centralizada
      resetearFormulario()
    } catch (err) {
      console.error('Error al cumplimentar el hito:', err)
      showToastMessage('Error al cumplimentar el hito', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      style={{
        fontFamily: atisaStyles.fonts.secondary
      }}
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
          <i className="bi bi-check-circle me-2" style={{ color: 'white' }}></i>
          Cumplimentar hito - {nombreDocumento}
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
      <Modal.Body
        style={{
          backgroundColor: 'white',
          padding: '24px'
        }}
      >
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4">
            <Form.Label
              className="fw-bold"
              style={{
                fontFamily: atisaStyles.fonts.primary,
                color: atisaStyles.colors.primary,
                fontSize: '16px'
              }}
            >
              <i className="bi bi-calendar-event me-2"></i>
              Fecha de Cumplimiento
            </Form.Label>
            <Form.Control
              type="date"
              value={fechaCumplimiento}
              onChange={(e) => setFechaCumplimiento(e.target.value)}
              disabled={!fechaEditable}
              className={fechaEditable ? 'form-control' : 'form-control bg-light'}
              style={{
                border: `2px solid ${fechaEditable ? atisaStyles.colors.light : '#e9ecef'}`,
                borderRadius: '8px',
                fontFamily: atisaStyles.fonts.secondary,
                fontSize: '14px',
                height: '48px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                if (fechaEditable) {
                  e.target.style.borderColor = atisaStyles.colors.accent
                  e.target.style.boxShadow = `0 0 0 3px rgba(0, 161, 222, 0.1)`
                }
              }}
              onBlur={(e) => {
                if (fechaEditable) {
                  e.target.style.borderColor = atisaStyles.colors.light
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
            <Form.Text
              className="text-muted"
              style={{
                fontFamily: atisaStyles.fonts.secondary,
                fontSize: '13px'
              }}
            >
              {fechaEditable ? 'Puedes modificar la fecha de cumplimiento' : 'Fecha actual por defecto'}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Check
              type="checkbox"
              id="editarFecha"
              label="Editar fecha de cumplimiento"
              checked={fechaEditable}
              onChange={handleCheckboxChange}
              style={{
                fontFamily: atisaStyles.fonts.secondary,
                color: atisaStyles.colors.dark
              }}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label
              className="fw-bold"
              style={{
                fontFamily: atisaStyles.fonts.primary,
                color: atisaStyles.colors.primary,
                fontSize: '16px'
              }}
            >
              <i className="bi bi-clock me-2"></i>
              Hora de Cumplimiento
            </Form.Label>
            <Form.Control
              type="time"
              value={horaCumplimiento}
              onChange={(e) => setHoraCumplimiento(e.target.value)}
              disabled={!horaEditable}
              className={horaEditable ? 'form-control' : 'form-control bg-light'}
              style={{
                border: `2px solid ${horaEditable ? atisaStyles.colors.light : '#e9ecef'}`,
                borderRadius: '8px',
                fontFamily: atisaStyles.fonts.secondary,
                fontSize: '14px',
                height: '48px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                if (horaEditable) {
                  e.target.style.borderColor = atisaStyles.colors.accent
                  e.target.style.boxShadow = `0 0 0 3px rgba(0, 161, 222, 0.1)`
                }
              }}
              onBlur={(e) => {
                if (horaEditable) {
                  e.target.style.borderColor = atisaStyles.colors.light
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
            <Form.Text
              className="text-muted"
              style={{
                fontFamily: atisaStyles.fonts.secondary,
                fontSize: '13px'
              }}
            >
              {horaEditable ? 'Puedes modificar la hora de cumplimiento' : 'Hora actual por defecto'}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Check
              type="checkbox"
              id="editarHora"
              label="Editar hora de cumplimiento"
              checked={horaEditable}
              onChange={handleHoraCheckboxChange}
              style={{
                fontFamily: atisaStyles.fonts.secondary,
                color: atisaStyles.colors.dark
              }}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Check
              type="checkbox"
              id="incluirDocumento"
              label="Incluir documento/s adjunto/s (opcional)"
              checked={incluirDocumento}
              onChange={(e) => setIncluirDocumento(e.target.checked)}
              style={{
                fontFamily: atisaStyles.fonts.secondary,
                color: atisaStyles.colors.dark,
                fontSize: '16px',
                fontWeight: '600'
              }}
            />
          </Form.Group>

          {incluirDocumento && (
            <div className="mb-4">
              {/* Zona de Drag & Drop */}
              <div
                className={`border border-2 border-dashed rounded p-4 text-center position-relative ${dragActive ? 'border-primary bg-light' : 'border-secondary'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  cursor: 'pointer',
                  minHeight: '120px',
                  borderColor: dragActive ? atisaStyles.colors.accent : atisaStyles.colors.light,
                  backgroundColor: dragActive ? '#f8f9fa' : 'white',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }}
                onClick={handleFileSelectClick}
              >
                <div className="d-flex flex-column align-items-center justify-content-center h-100">
                  <i
                    className="bi bi-upload fs-1 mb-2"
                    style={{
                      color: dragActive ? atisaStyles.colors.accent : atisaStyles.colors.primary
                    }}
                  ></i>
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: atisaStyles.fonts.secondary,
                      color: atisaStyles.colors.dark,
                      fontWeight: '600'
                    }}
                  >
                    Arrastra y suelta tus archivos aquí o haz clic para seleccionar
                  </p>
                  <small
                    style={{
                      fontFamily: atisaStyles.fonts.secondary,
                      color: atisaStyles.colors.dark
                    }}
                  >
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
                  <h6
                    className="fw-bold mb-2"
                    style={{
                      fontFamily: atisaStyles.fonts.primary,
                      color: atisaStyles.colors.primary,
                      fontSize: '16px'
                    }}
                  >
                    <i className="bi bi-files me-2"></i>
                    Archivos seleccionados ({files.length})
                  </h6>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="border rounded mb-2 p-3"
                        style={{
                          borderColor: atisaStyles.colors.light,
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          boxShadow: '0 2px 4px rgba(0, 80, 92, 0.1)'
                        }}
                      >
                        {/* Cabecera del archivo */}
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            <i
                              className="bi bi-file-earmark me-2"
                              style={{
                                color: atisaStyles.colors.accent,
                                fontSize: '20px'
                              }}
                            ></i>
                            <div>
                              <div
                                className="fw-semibold"
                                style={{
                                  fontFamily: atisaStyles.fonts.secondary,
                                  color: atisaStyles.colors.primary
                                }}
                              >
                                {file.name}
                              </div>
                              <small
                                style={{
                                  fontFamily: atisaStyles.fonts.secondary,
                                  color: atisaStyles.colors.dark
                                }}
                              >
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </small>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(index)
                            }}
                            title="Eliminar archivo"
                            style={{
                              backgroundColor: 'transparent',
                              color: '#dc3545',
                              border: '1px solid #dc3545',
                              borderRadius: '6px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#dc3545'
                              e.currentTarget.style.color = 'white'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = '#dc3545'
                            }}
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
          )}

          {/* Progreso y resultados de subida */}
          {incluirDocumento && showUploadResults && (
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

          <Form.Group className="mb-4">
            <Form.Label
              className="fw-bold"
              style={{
                fontFamily: atisaStyles.fonts.primary,
                color: atisaStyles.colors.primary,
                fontSize: '16px'
              }}
            >
              <i className="bi bi-chat-text me-2"></i>
              Observaciones
              {fechaEditable && <span className="text-danger"> *</span>}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder={fechaEditable
                ? "Las observaciones son obligatorias cuando se edita la fecha de cumplimiento"
                : "Añade observaciones sobre el cumplimiento del hito (opcional)"
              }
              className={fechaEditable && (!observacion || observacion.trim() === '') ? 'is-invalid' : ''}
              style={{
                border: `2px solid ${fechaEditable && (!observacion || observacion.trim() === '') ? '#dc3545' : atisaStyles.colors.light}`,
                borderRadius: '8px',
                fontFamily: atisaStyles.fonts.secondary,
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = atisaStyles.colors.accent
                e.target.style.boxShadow = `0 0 0 3px rgba(0, 161, 222, 0.1)`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = fechaEditable && (!observacion || observacion.trim() === '') ? '#dc3545' : atisaStyles.colors.light
                e.target.style.boxShadow = 'none'
              }}
            />
            {fechaEditable && (
              <Form.Text
                style={{
                  fontFamily: atisaStyles.fonts.secondary,
                  fontSize: '13px',
                  color: atisaStyles.colors.dark
                }}
              >
                Campo obligatorio cuando se edita la fecha de cumplimiento
              </Form.Text>
            )}
          </Form.Group>

          <Button
            type="submit"
            className="mt-3"
            disabled={loading || (incluirDocumento && files.length === 0)}
            style={{
              backgroundColor: atisaStyles.colors.secondary,
              border: `2px solid ${atisaStyles.colors.secondary}`,
              color: 'white',
              fontFamily: atisaStyles.fonts.secondary,
              fontWeight: '600',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(156, 186, 57, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                e.currentTarget.style.borderColor = atisaStyles.colors.accent
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 161, 222, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                e.currentTarget.style.borderColor = atisaStyles.colors.secondary
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(156, 186, 57, 0.3)'
              }
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Procesando...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Cumplimentar
              </>
            )}
          </Button>
        </Form>
      </Modal.Body>

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

export default CumplimentarHitoModal
