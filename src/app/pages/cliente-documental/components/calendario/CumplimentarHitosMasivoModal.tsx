import { FC, useRef, useState, useEffect } from 'react'
import { Modal, Button, Form, ProgressBar, Alert } from 'react-bootstrap'
import { updateClienteProcesoHito } from '../../../../api/clienteProcesoHitos'
import { subirDocumentoCumplimiento } from '../../../../api/documentosCumplimiento'
import { createClienteProcesoHitoCumplimiento } from '../../../../api/clienteProcesoHitoCumplimientos'
import { atisaStyles } from '../../../../styles/atisaStyles'
import { useAuth } from '../../../../modules/auth/core/Auth'

interface Props {
    show: boolean
    onHide: () => void
    ids: number[] // IDs de los hitos a cumplimentar
    onSuccess: (count: number) => void
}

interface FileUploadStatus {
    file: File
    status: 'pending' | 'uploading' | 'success' | 'error'
    error?: string
}

const CumplimentarHitosMasivoModal: FC<Props> = ({ show, onHide, ids, onSuccess }) => {
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
        return now.toTimeString().slice(0, 5)
    })
    const [horaEditable, setHoraEditable] = useState(false)
    const [observacion, setObservacion] = useState('')
    const [dragActive, setDragActive] = useState(false)

    // Estados Proceso Masivo
    const [processedCount, setProcessedCount] = useState(0)
    const [failedCount, setFailedCount] = useState(0)
    const [currentProcessingId, setCurrentProcessingId] = useState<number | null>(null)

    // Función auxiliar para mostrar mensaje (usando un alert local o similar si se desea)
    const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        setToastMessage(message)
        setToastType(type)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
    }

    const getCurrentUsername = (): string => {
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
        if (currentUser?.username) return currentUser.username
        return 'usuario'
    }

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
        setProcessedCount(0)
        setFailedCount(0)
        setLoading(false)
        setCurrentProcessingId(null)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(prev => [...prev, ...Array.from(e.target.files || [])])
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
            setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)])
        }
    }

    const removeFile = (indexToRemove: number) => {
        setFiles(prev => prev.filter((_, index) => index !== indexToRemove))
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked
        setFechaEditable(checked)
        if (!checked) {
            const today = new Date()
            setFechaCumplimiento(today.toISOString().split('T')[0])
        }
    }

    const handleHoraCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked
        setHoraEditable(checked)
        if (!checked) {
            const now = new Date()
            setHoraCumplimiento(now.toTimeString().slice(0, 5))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validaciones basicas
        let fechaActual = new Date();
        let fechaCumplimientoDate = new Date(fechaCumplimiento);
        if (fechaCumplimientoDate > fechaActual) {
            showToastMessage('La fecha de cumplimiento no puede ser mayor a la fecha actual', 'warning')
            return
        }

        const hoy = new Date();
        const esHoy = fechaCumplimientoDate.toDateString() === hoy.toDateString();
        if (esHoy) {
            const horaActual = hoy.toTimeString().slice(0, 5);
            if (horaCumplimiento > horaActual) {
                showToastMessage('La hora de cumplimiento no puede ser superior a la hora actual cuando es la fecha actual.', 'warning')
                return
            }
        }

        if (incluirDocumento && files.length === 0) {
            showToastMessage('Por favor selecciona al menos un archivo para subir', 'warning')
            return
        }

        if (fechaEditable && (!observacion || observacion.trim() === '')) {
            showToastMessage('Las observaciones son obligatorias cuando se edita la fecha de cumplimiento', 'warning')
            return
        }

        setLoading(true)
        setProcessedCount(0)
        setFailedCount(0)

        try {
            for (let i = 0; i < ids.length; i++) {
                const hitoId = ids[i]
                setCurrentProcessingId(hitoId)

                try {
                    // 1. Update Estado
                    await updateClienteProcesoHito(hitoId, {
                        estado: 'Finalizado',
                        fecha_estado: new Date().toISOString()
                    })

                    // 2. Crear Cumplimiento
                    const cumplimiento = await createClienteProcesoHitoCumplimiento({
                        cliente_proceso_hito_id: hitoId,
                        fecha: fechaCumplimiento,
                        hora: horaCumplimiento,
                        observacion: observacion || undefined,
                        usuario: getCurrentUsername(),
                        codSubDepar: getCurrentCodSubDepar()
                    })

                    // 3. Subir Archivos (si hay)
                    if (incluirDocumento && files.length > 0 && cumplimiento.id) {
                        for (const file of files) {
                            try {
                                await subirDocumentoCumplimiento(cumplimiento.id, file.name, file, getCurrentUsername(), getCurrentCodSubDepar())
                            } catch (errFile) {
                                console.error(`Error subiendo archivo ${file.name} para hito ${hitoId}`, errFile)
                                // No contamos como fallo total del cumplimiento si solo fallan archivos, o quizás si?
                                // Por ahora logueamos y seguimos.
                            }
                        }
                    }

                    setProcessedCount(prev => prev + 1)

                } catch (errHito) {
                    console.error(`Error procesando hito ${hitoId}`, errHito)
                    setFailedCount(prev => prev + 1)
                }
            }

            onSuccess(ids.length - failedCount) // Enviamos exitosos
            onHide()
            resetearFormulario()

        } catch (err) {
            console.error('Error general en proceso masivo:', err)
            showToastMessage('Error en el proceso masivo', 'error')
        } finally {
            setLoading(false)
            setCurrentProcessingId(null)
        }
    }

    // Notificación local simple
    const renderToast = () => {
        if (!showToast) return null;
        let bgColor = atisaStyles.colors.accent; // info
        if (toastType === 'warning') bgColor = atisaStyles.colors.warning;
        if (toastType === 'error') bgColor = atisaStyles.colors.error;
        if (toastType === 'success') bgColor = atisaStyles.colors.secondary;

        return (
            <div style={{
                position: 'absolute', top: '10px', right: '10px', zIndex: 9999,
                backgroundColor: bgColor, color: 'white', padding: '10px 20px', borderRadius: '8px',
                fontFamily: atisaStyles.fonts.secondary, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
                {toastMessage}
            </div>
        )
    }

    return (
        <Modal
            show={show}
            onHide={loading ? () => { } : onHide} // Prevenir cierre si cargando
            size="lg"
            style={{ fontFamily: atisaStyles.fonts.secondary }}
            backdrop={loading ? 'static' : true}
            keyboard={!loading}
        >
            <Modal.Header style={{
                backgroundColor: atisaStyles.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '12px 12px 0 0',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Modal.Title style={{
                    fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', color: 'white', fontSize: '1.5rem',
                    display: 'flex', alignItems: 'center', gap: '12px', margin: 0
                }}>
                    <i className="bi bi-check-all me-2"></i>
                    Cumplimentar {ids.length} Hitos Seleccionados
                </Modal.Title>
                {!loading && (
                    <div className='btn btn-icon btn-sm' onClick={onHide} style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '8px', width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}>
                        <i className="bi bi-x text-white" style={{ fontSize: '16px' }}></i>
                    </div>
                )}
            </Modal.Header>

            <Modal.Body style={{ backgroundColor: 'white', padding: '24px', position: 'relative' }}>
                {renderToast()}

                {loading ? (
                    <div className="text-center py-5">
                        <h5 className="mb-3" style={{ color: atisaStyles.colors.primary, fontFamily: atisaStyles.fonts.primary }}>
                            Procesando Hitos...
                        </h5>
                        <ProgressBar
                            now={((processedCount + failedCount) / ids.length) * 100}
                            label={`${processedCount + failedCount} / ${ids.length}`}
                            animated
                            variant="info"
                            style={{ height: '24px', fontSize: '14px', fontWeight: 'bold' }}
                        />
                        <p className="mt-3 text-muted">
                            Por favor no cierres esta ventana.
                        </p>
                        {failedCount > 0 && (
                            <p className="text-danger">Errores: {failedCount}</p>
                        )}
                    </div>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold" style={{ color: atisaStyles.colors.primary, fontSize: '16px' }}>
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
                                    borderRadius: '8px', height: '48px'
                                }}
                            />
                            <Form.Text className="text-muted">
                                {fechaEditable ? 'Puedes modificar la fecha de cumplimiento' : 'Fecha actual por defecto'}
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Check type="checkbox" label="Editar fecha de cumplimiento" checked={fechaEditable} onChange={handleCheckboxChange}
                                style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.dark }} />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold" style={{ color: atisaStyles.colors.primary, fontSize: '16px' }}>
                                <i className="bi bi-clock me-2"></i>
                                Hora de Cumplimiento
                            </Form.Label>
                            <Form.Control type="time" value={horaCumplimiento} onChange={(e) => setHoraCumplimiento(e.target.value)}
                                disabled={!horaEditable}
                                className={horaEditable ? 'form-control' : 'form-control bg-light'}
                                style={{ border: `2px solid ${horaEditable ? atisaStyles.colors.light : '#e9ecef'}`, borderRadius: '8px', height: '48px' }}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Check type="checkbox" label="Editar hora de cumplimiento" checked={horaEditable} onChange={handleHoraCheckboxChange}
                                style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.dark }} />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Check type="checkbox" label="Incluir documento/s adjunto/s (se aplicará a TODOS los hitos seleccionados)"
                                checked={incluirDocumento} onChange={(e) => setIncluirDocumento(e.target.checked)}
                                style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.dark, fontSize: '16px', fontWeight: '600' }} />
                        </Form.Group>

                        {incluirDocumento && (
                            <div className="mb-4">
                                <div
                                    className={`border border-2 border-dashed rounded p-4 text-center ${dragActive ? 'border-primary bg-light' : 'border-secondary'}`}
                                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                    style={{
                                        cursor: 'pointer', minHeight: '120px', borderRadius: '12px',
                                        borderColor: dragActive ? atisaStyles.colors.accent : atisaStyles.colors.light,
                                        backgroundColor: dragActive ? '#f8f9fa' : 'white',
                                    }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                        <i className="bi bi-upload fs-1 mb-2" style={{ color: atisaStyles.colors.primary }}></i>
                                        <p className="mb-1 fw-bold" style={{ color: atisaStyles.colors.dark }}>Arrastra archivos o haz clic</p>
                                        <small style={{ color: atisaStyles.colors.dark }}>Se adjuntarán los mismos archivos a cada hito seleccionado</small>
                                    </div>
                                    <input type="file" multiple onChange={handleFileChange} ref={fileInputRef} className="d-none" />
                                </div>

                                {files.length > 0 && (
                                    <div className="mt-3">
                                        <h6 className="fw-bold mb-2" style={{ color: atisaStyles.colors.primary }}>Archivos seleccionados ({files.length})</h6>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {files.map((file, index) => (
                                                <div key={index} className="border rounded mb-2 p-2 d-flex justify-content-between align-items-center bg-white shadow-sm">
                                                    <div className='d-flex align-items-center overflow-hidden'>
                                                        <i className="bi bi-file-earmark me-2 text-primary"></i>
                                                        <span className="text-truncate" style={{ maxWidth: '300px' }}>{file.name}</span>
                                                    </div>
                                                    <button type="button" className="btn btn-sm btn-outline-danger border-0" onClick={(e) => { e.stopPropagation(); removeFile(index); }}>
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold" style={{ color: atisaStyles.colors.primary, fontSize: '16px' }}>
                                <i className="bi bi-chat-text me-2"></i>
                                Observaciones {fechaEditable && <span className="text-danger">*</span>}
                            </Form.Label>
                            <Form.Control as="textarea" rows={3} value={observacion} onChange={(e) => setObservacion(e.target.value)}
                                placeholder="Observaciones para todos los hitos (opcional salvo edición de fecha)"
                                style={{ border: `2px solid ${atisaStyles.colors.light}`, borderRadius: '8px', resize: 'none' }}
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="light" onClick={onHide} className="border" style={{ color: atisaStyles.colors.dark }}>
                                Cancelar
                            </Button>
                            <Button type="submit" style={{ backgroundColor: atisaStyles.colors.secondary, border: 'none' }}>
                                <i className="bi bi-check-all me-2"></i>
                                Cumplimentar {ids.length} Hitos
                            </Button>
                        </div>
                    </Form>
                )}
            </Modal.Body>
        </Modal>
    )
}

export default CumplimentarHitosMasivoModal
