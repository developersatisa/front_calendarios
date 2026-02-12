import { FC, useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { Proceso } from '../../../api/procesos'
import {
    DocumentalCarpetaProceso,
    getDocumentalCarpetaProcesoByProcesoId,
    createDocumentalCarpetaProceso,
    updateDocumentalCarpetaProceso,
    deleteDocumentalCarpetaProceso
} from '../../../api/documentalCarpetaProceso'
import { atisaStyles } from '../../../styles/atisaStyles'

interface Props {
    show: boolean
    onHide: () => void
    proceso: Proceso | null
}

const DocumentalCarpetaProcesoModal: FC<Props> = ({ show, onHide, proceso }) => {
    const [carpetas, setCarpetas] = useState<DocumentalCarpetaProceso[]>([])
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)

    // Form state
    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')

    useEffect(() => {
        if (show && proceso) {
            loadCarpetas(proceso.id)
            resetForm()
        }
    }, [show, proceso])

    const loadCarpetas = async (procesoId: number) => {
        setLoading(true)
        try {
            const response = await getDocumentalCarpetaProcesoByProcesoId(procesoId)
            setCarpetas(response.carpetas || [])
        } catch (error) {
            console.error('Error loading folders:', error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setNombre('')
        setDescripcion('')
        setEditingId(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!proceso) return

        try {
            if (editingId) {
                // Update
                await updateDocumentalCarpetaProceso(editingId, {
                    nombre,
                    descripcion
                })
            } else {
                // Create
                await createDocumentalCarpetaProceso({
                    proceso_id: proceso.id,
                    nombre,
                    descripcion
                })
            }
            loadCarpetas(proceso.id)
            resetForm()
        } catch (error) {
            console.error('Error saving folder:', error)
        }
    }

    const handleEdit = (carpeta: DocumentalCarpetaProceso) => {
        setNombre(carpeta.nombre)
        setDescripcion(carpeta.descripcion)
        setEditingId(carpeta.id)
    }

    const handleDelete = async (id: number) => {
        if (!proceso || !confirm('¿Está seguro de eliminar esta carpeta?')) return

        try {
            await deleteDocumentalCarpetaProceso(id)
            loadCarpetas(proceso.id)
            if (editingId === id) resetForm()
        } catch (error) {
            console.error('Error deleting folder:', error)
        }
    }

    return (
        <Modal
            show={show}
            onHide={onHide}
            aria-labelledby='kt_modal_carpeta_proceso'
            dialogClassName='modal-dialog modal-dialog-centered mw-800px'
            style={{
                fontFamily: atisaStyles.fonts.secondary
            }}
        >
            <Modal.Header
                className='modal-header'
                style={{
                    backgroundColor: atisaStyles.colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px 12px 0 0'
                }}
            >
                <Modal.Title
                    className='fw-bolder'
                    style={{
                        fontFamily: atisaStyles.fonts.primary,
                        fontWeight: 'bold',
                        color: 'white',
                        fontSize: '1.5rem'
                    }}
                >
                    <i className="bi bi-folder2-open me-2"></i>
                    Configurar Carpetas para: {proceso?.nombre}
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
                className='modal-body scroll-y mx-5 mx-xl-15 my-7'
                style={{
                    backgroundColor: 'white',
                    padding: '24px'
                }}
            >
                {/* Form Section */}
                <div className="card mb-5 shadow-sm border-0 bg-light">
                    <div className="card-body">
                        <h5 className="card-title mb-4" style={{ color: atisaStyles.colors.primary, fontFamily: atisaStyles.fonts.primary }}>
                            {editingId ? 'Editar Carpeta' : 'Nueva Carpeta'}
                        </h5>
                        <form onSubmit={handleSubmit} className="row g-3">
                            <div className="col-md-5">
                                <label className="form-label fw-bold">Nombre</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    required
                                    placeholder="Nombre de la carpeta"
                                    style={{ borderRadius: '8px', border: `1px solid ${atisaStyles.colors.light}` }}
                                />
                            </div>
                            <div className="col-md-5">
                                <label className="form-label fw-bold">Descripción</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    placeholder="Descripción breve"
                                    style={{ borderRadius: '8px', border: `1px solid ${atisaStyles.colors.light}` }}
                                />
                            </div>
                            <div className="col-md-2 d-flex align-items-end">
                                <div className="d-flex gap-2 w-100">
                                    <button
                                        type="submit"
                                        className="btn w-100"
                                        style={{
                                            backgroundColor: editingId ? atisaStyles.colors.secondary : atisaStyles.colors.primary,
                                            color: 'white',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        <i className={`bi ${editingId ? 'bi-check-lg' : 'bi-plus-lg'}`}></i>
                                    </button>
                                    {editingId && (
                                        <button
                                            type="button"
                                            className="btn btn-secondary w-100"
                                            onClick={resetForm}
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-muted fw-bolder fs-7 text-uppercase gs-0">
                                    <th className="min-w-150px">Nombre</th>
                                    <th className="min-w-250px">Descripción</th>
                                    <th className="text-end min-w-100px">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 fw-bold">
                                {carpetas.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center py-4">
                                            No hay carpetas configuradas
                                        </td>
                                    </tr>
                                ) : (
                                    carpetas.map((carpeta) => (
                                        <tr key={carpeta.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-folder-fill fs-3 me-2 text-warning"></i>
                                                    <span className="text-gray-800 text-hover-primary mb-1">
                                                        {carpeta.nombre}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>{carpeta.descripcion || '-'}</td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                                                    onClick={() => handleEdit(carpeta)}
                                                    title="Editar"
                                                >
                                                    <i className="bi bi-pencil-fill fs-5"></i>
                                                </button>
                                                <button
                                                    className="btn btn-icon btn-bg-light btn-active-color-danger btn-sm"
                                                    onClick={() => handleDelete(carpeta.id)}
                                                    title="Eliminar"
                                                >
                                                    <i className="bi bi-trash-fill fs-5"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer
                className='modal-footer'
                style={{
                    backgroundColor: '#f8f9fa',
                    border: 'none',
                    borderRadius: '0 0 12px 12px',
                    padding: '20px 24px'
                }}
            >
                <button
                    type='button'
                    className='btn'
                    onClick={onHide}
                    style={{
                        backgroundColor: atisaStyles.colors.secondary,
                        color: 'white',
                        borderRadius: '8px',
                        fontFamily: atisaStyles.fonts.secondary,
                        fontWeight: '600',
                        padding: '10px 20px',
                        fontSize: '14px',
                        border: 'none'
                    }}
                >
                    Cerrar
                </button>
            </Modal.Footer>
        </Modal>
    )
}

export default DocumentalCarpetaProcesoModal
