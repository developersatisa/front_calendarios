import { FC, useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Hito } from '../../../api/hitos'
import { getClientesPorHito, Cliente } from '../../../api/clientes'
import { updateMasivoHitos } from '../../../api/clienteProcesoHitos'
import { atisaStyles } from '../../../styles/atisaStyles'
import SharedPagination from '../../../components/pagination/SharedPagination'

type Props = {
    show: boolean
    onHide: () => void
    hito: Hito | null
    onSuccess: (message: string) => void
    onError: (message: string) => void
}

const ActualizaMasivaHitosModal: FC<Props> = ({ show, onHide, hito, onSuccess, onError }) => {
    const [loading, setLoading] = useState(false)
    const [loadingClientes, setLoadingClientes] = useState(false)
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [selectedClientes, setSelectedClientes] = useState<string[]>([]) // IDs de api_clientes
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [totalItems, setTotalItems] = useState(0)

    // Ordenación
    const [sortField, setSortField] = useState<string>('razsoc')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const formik = useFormik({
        initialValues: {
            fecha_desde: '',
            fecha_hasta: '',
            nueva_fecha: '',
        },
        validationSchema: Yup.object({
            fecha_desde: Yup.string().required('La fecha de corte desde es obligatoria'),
            fecha_hasta: Yup.string(),
            nueva_fecha: Yup.string().required('La nueva fecha límite es obligatoria'),
        }),
        onSubmit: async (values) => {
            if (!hito) return
            if (selectedClientes.length === 0) {
                onError('Debes seleccionar al menos una empresa')
                return
            }

            setLoading(true)
            try {
                const payload = {
                    hito_id: hito.id,
                    empresa_ids: selectedClientes,
                    fecha_desde: values.fecha_desde,
                    fecha_hasta: values.fecha_hasta,
                    nueva_fecha: values.nueva_fecha
                }

                await updateMasivoHitos(payload)
                onSuccess('Actualización masiva completada correctamente')
                onHide()

            } catch (error: any) {
                console.error('Error en update masivo:', error)
                const msg = error?.response?.data?.detail || 'Error al realizar la actualización masiva'
                onError(msg)
            } finally {
                setLoading(false)
            }
        },
    })

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    // Reset pagination and selection when search changes
    useEffect(() => {
        setCurrentPage(1)
        setSelectedClientes([])
    }, [debouncedSearchTerm])

    // Load clients on show or params change
    useEffect(() => {
        if (show) {
            loadClientes()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, currentPage, debouncedSearchTerm, sortField, sortDirection])

    // Reset when opening/closing modal
    useEffect(() => {
        if (show) {
            setSelectedClientes([])
            formik.resetForm()
        } else {
            setSearchTerm('')
            setDebouncedSearchTerm('')
            setCurrentPage(1)
            setClientes([])
            setTotalItems(0)
            setSortField('razsoc')
            setSortDirection('asc')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show])

    const loadClientes = async () => {
        if (!hito) return

        try {
            setLoadingClientes(true)
            const response = await getClientesPorHito(
                hito.id,
                currentPage,
                itemsPerPage,
                debouncedSearchTerm,
                sortField,
                sortDirection
            )
            setClientes(response.clientes || [])
            setTotalItems(response.total || 0)
        } catch (error) {
            console.error('Error al cargar clientes:', error)
            onError('Error al cargar listado de empresas')
            setClientes([])
            setTotalItems(0)
        } finally {
            setLoadingClientes(false)
        }
    }

    // Paginación server-side
    // 'clientes' ya contiene solo la página actual
    const currentClientes = clientes
    // totalItems se actualiza en loadClientes

    // Lógica para "Seleccionar todo en la página"
    const allCurrentSelected = currentClientes.length > 0 && currentClientes.every(c => selectedClientes.includes(c.idcliente))

    const handleSelectCurrentPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Añadir los de la página actual que no estén ya seleccionados
            const newSelected = [...selectedClientes]
            currentClientes.forEach(c => {
                if (!newSelected.includes(c.idcliente)) {
                    newSelected.push(c.idcliente)
                }
            })
            setSelectedClientes(newSelected)
        } else {
            // Quitar los de la página actual
            const idsToRemove = currentClientes.map(c => c.idcliente)
            setSelectedClientes(selectedClientes.filter(id => !idsToRemove.includes(id)))
        }
    }

    const handleClearSelection = () => {
        setSelectedClientes([])
    }

    const handleSelectClient = (id: string) => {
        if (selectedClientes.includes(id)) {
            setSelectedClientes(selectedClientes.filter(cId => cId !== id))
        } else {
            setSelectedClientes([...selectedClientes, id])
        }
    }

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const getSortIcon = (field: string) => {
        if (sortField !== field) {
            return <i className='bi bi-arrow-down-up ms-1' style={{ fontSize: '12px', opacity: 0.5 }}></i>
        }
        return (
            <i
                className={`bi ${sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'} ms-1`}
                style={{ fontSize: '12px', color: 'white' }}
            ></i>
        )
    }

    return (
        <Modal
            show={show}
            onHide={onHide}
            aria-labelledby='kt_modal_actualiza_masiva'
            dialogClassName='modal-dialog modal-dialog-centered mw-850px'
            style={{
                fontFamily: atisaStyles.fonts.secondary
            }}
        >
            <form onSubmit={formik.handleSubmit} className='form'>
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
                        <i className="bi bi-calendar-range-fill me-2" style={{ color: 'white' }}></i>
                        Actualización Masiva: {hito?.nombre}
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
                    <div className='row mb-5'>
                        <div className='col-md-4 fv-row mb-4'>
                            <label
                                className='required fw-bold fs-6 mb-2'
                                style={{
                                    fontFamily: atisaStyles.fonts.primary,
                                    color: atisaStyles.colors.primary,
                                    fontSize: '16px'
                                }}
                            >
                                <i className="bi bi-calendar-event me-2"></i>
                                F. Corte Desde
                            </label>
                            <input
                                type='date'
                                className='form-control form-control-solid'
                                placeholder='Seleccionar fecha...'
                                value={formik.values.fecha_desde}
                                onChange={formik.handleChange}
                                name="fecha_desde"
                                style={{
                                    border: `2px solid ${atisaStyles.colors.light}`,
                                    borderRadius: '8px',
                                    fontFamily: atisaStyles.fonts.secondary,
                                    fontSize: '14px',
                                    height: '48px',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = atisaStyles.colors.accent
                                    e.target.style.boxShadow = `0 0 0 3px rgba(0, 161, 222, 0.1)`
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = atisaStyles.colors.light
                                    e.target.style.boxShadow = 'none'
                                    formik.handleBlur(e)
                                }}
                            />
                            {formik.touched.fecha_desde && formik.errors.fecha_desde && (
                                <div className='text-danger mt-1'>{formik.errors.fecha_desde}</div>
                            )}
                        </div>

                        <div className='col-md-4 fv-row mb-4'>
                            <label
                                className='fw-bold fs-6 mb-2'
                                style={{
                                    fontFamily: atisaStyles.fonts.primary,
                                    color: atisaStyles.colors.primary,
                                    fontSize: '16px'
                                }}
                            >
                                <i className="bi bi-calendar-event me-2"></i>
                                F. Corte Hasta
                            </label>
                            <input
                                type='date'
                                className='form-control form-control-solid'
                                placeholder='Seleccionar fecha...'
                                value={formik.values.fecha_hasta}
                                onChange={formik.handleChange}
                                name="fecha_hasta"
                                style={{
                                    border: `2px solid ${atisaStyles.colors.light}`,
                                    borderRadius: '8px',
                                    fontFamily: atisaStyles.fonts.secondary,
                                    fontSize: '14px',
                                    height: '48px',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = atisaStyles.colors.accent
                                    e.target.style.boxShadow = `0 0 0 3px rgba(0, 161, 222, 0.1)`
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = atisaStyles.colors.light
                                    e.target.style.boxShadow = 'none'
                                    formik.handleBlur(e)
                                }}
                            />
                            {formik.touched.fecha_hasta && formik.errors.fecha_hasta && (
                                <div className='text-danger mt-1'>{formik.errors.fecha_hasta}</div>
                            )}
                        </div>

                        <div className='col-md-4 fv-row mb-4'>
                            <label
                                className='required fw-bold fs-6 mb-2'
                                style={{
                                    fontFamily: atisaStyles.fonts.primary,
                                    color: atisaStyles.colors.primary,
                                    fontSize: '16px'
                                }}
                            >
                                <i className="bi bi-calendar-check me-2"></i>
                                Nueva Fecha Límite
                            </label>
                            <input
                                type='date'
                                className='form-control form-control-solid'
                                placeholder='Seleccionar fecha...'
                                value={formik.values.nueva_fecha}
                                onChange={formik.handleChange}
                                name="nueva_fecha"
                                style={{
                                    border: `2px solid ${atisaStyles.colors.light}`,
                                    borderRadius: '8px',
                                    fontFamily: atisaStyles.fonts.secondary,
                                    fontSize: '14px',
                                    height: '48px',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = atisaStyles.colors.accent
                                    e.target.style.boxShadow = `0 0 0 3px rgba(0, 161, 222, 0.1)`
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = atisaStyles.colors.light
                                    e.target.style.boxShadow = 'none'
                                    formik.handleBlur(e)
                                }}
                            />
                            {formik.touched.nueva_fecha && formik.errors.nueva_fecha && (
                                <div className='text-danger mt-1'>{formik.errors.nueva_fecha}</div>
                            )}
                        </div>
                    </div>

                    <div className='mb-3'>
                        <div
                            style={{
                                backgroundColor: atisaStyles.colors.light,
                                padding: '12px 16px',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                border: `1px solid ${atisaStyles.colors.accent}`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: atisaStyles.fonts.secondary,
                                    color: atisaStyles.colors.primary,
                                    fontWeight: '600',
                                    fontSize: '14px'
                                }}
                            >
                                <i className="bi bi-building me-2"></i>
                                Empresas seleccionadas: {selectedClientes.length}
                            </span>
                            <div className="d-flex gap-2">
                                {selectedClientes.length > 0 && (
                                    <button
                                        type="button"
                                        className="btn btn-sm"
                                        onClick={handleClearSelection}
                                        style={{
                                            backgroundColor: 'transparent',
                                            color: atisaStyles.colors.dark,
                                            border: `1px solid ${atisaStyles.colors.dark}`,
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            padding: '4px 8px',
                                        }}
                                    >
                                        <i className="bi bi-x me-1"></i>
                                        Limpiar
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className='d-flex justify-content-between align-items-center mb-3 gap-2'>
                            <div className="position-relative w-50">
                                <span className="position-absolute top-50 translate-middle-y ms-3">
                                    <i className="bi bi-search text-gray-500"></i>
                                </span>
                                <input
                                    type='text'
                                    className='form-control form-control-solid ps-10'
                                    placeholder='Buscar empresa...'
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        border: `2px solid ${atisaStyles.colors.light}`,
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        </div>

                        <div className='table-responsive' style={{ border: `1px solid ${atisaStyles.colors.light}`, borderRadius: '12px', overflow: 'hidden' }}>
                            {loadingClientes ? (
                                <div className='d-flex justify-content-center p-10'>
                                    <div className='spinner-border text-primary' role='status'></div>
                                </div>
                            ) : (
                                <table className='table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3 mb-0'>
                                    <thead className="" style={{ backgroundColor: atisaStyles.colors.primary, color: 'white' }}>
                                        <tr className="fw-bolder fs-6 border-bottom border-gray-200">
                                            <th className="ps-4 w-40px py-3">
                                                <div className='form-check form-check-custom form-check-solid'>
                                                    <input
                                                        className='form-check-input'
                                                        type='checkbox'
                                                        checked={allCurrentSelected}
                                                        onChange={handleSelectCurrentPage}
                                                        style={{
                                                            borderColor: 'white',
                                                            backgroundColor: allCurrentSelected ? atisaStyles.colors.secondary : 'transparent'
                                                        }}
                                                    />
                                                </div>
                                            </th>
                                            <th
                                                className="py-3 text-white cursor-pointer"
                                                onClick={() => handleSort('razsoc')}
                                            >
                                                Empresa {getSortIcon('razsoc')}
                                            </th>
                                            <th
                                                className="py-3 text-white cursor-pointer"
                                                onClick={() => handleSort('cif')}
                                            >
                                                CIF {getSortIcon('cif')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentClientes.map((cliente) => (
                                            <tr
                                                key={cliente.idcliente}
                                                style={{
                                                    backgroundColor: selectedClientes.includes(cliente.idcliente) ? 'rgba(156, 186, 57, 0.15)' : 'transparent',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                className="border-bottom"
                                                onClick={(e) => {
                                                    if ((e.target as HTMLElement).tagName !== 'INPUT') {
                                                        handleSelectClient(cliente.idcliente)
                                                    }
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!selectedClientes.includes(cliente.idcliente)) {
                                                        e.currentTarget.style.backgroundColor = '#f8f9fa'
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!selectedClientes.includes(cliente.idcliente)) {
                                                        e.currentTarget.style.backgroundColor = 'transparent'
                                                    }
                                                }}
                                            >
                                                <td className='ps-4'>
                                                    <div className='form-check form-check-custom form-check-solid'>
                                                        <input
                                                            className='form-check-input'
                                                            type='checkbox'
                                                            checked={selectedClientes.includes(cliente.idcliente)}
                                                            onChange={() => handleSelectClient(cliente.idcliente)}
                                                            style={{
                                                                borderColor: atisaStyles.colors.primary,
                                                                backgroundColor: selectedClientes.includes(cliente.idcliente) ? atisaStyles.colors.secondary : 'transparent'
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className='text-gray-900 fw-bold fs-6'>{cliente.razsoc}</span>
                                                </td>
                                                <td>
                                                    <span className='text-muted fw-bold fs-7'>{cliente.cif || '-'}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {currentClientes.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className='text-center text-muted p-10 fs-6'>
                                                    <i className="bi bi-search fs-1 d-block mb-3 text-gray-400"></i>
                                                    No se encontraron empresas.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Paginación */}
                        <div className="mt-4">
                            <SharedPagination
                                currentPage={currentPage}
                                totalItems={totalItems}
                                pageSize={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
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
                        disabled={loading}
                        style={{
                            backgroundColor: 'transparent',
                            color: atisaStyles.colors.dark,
                            border: `2px solid ${atisaStyles.colors.light}`,
                            borderRadius: '8px',
                            fontFamily: atisaStyles.fonts.secondary,
                            fontWeight: '600',
                            padding: '10px 20px',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                            e.currentTarget.style.color = atisaStyles.colors.primary
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = atisaStyles.colors.dark
                        }}
                    >
                        <i className="bi bi-x-circle me-2"></i>
                        Cancelar
                    </button>
                    <button
                        type='submit'
                        className='btn'
                        disabled={loading || selectedClientes.length === 0}
                        style={{
                            backgroundColor: selectedClientes.length === 0 ? '#6c757d' : atisaStyles.colors.secondary,
                            border: 'none',
                            color: 'white',
                            fontFamily: atisaStyles.fonts.secondary,
                            fontWeight: '600',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            marginLeft: '12px',
                            boxShadow: '0 4px 15px rgba(156, 186, 57, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            if (selectedClientes.length > 0) {
                                e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 161, 222, 0.4)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (selectedClientes.length > 0) {
                                e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(156, 186, 57, 0.3)'
                            }
                        }}
                    >
                        {loading ? (
                            <>
                                <span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
                                Procesando...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-circle me-2"></i>
                                Actualizar
                            </>
                        )}
                    </button>
                </Modal.Footer>
            </form>
        </Modal>
    )
}

export default ActualizaMasivaHitosModal
