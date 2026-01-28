import { FC, useState, useEffect } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { atisaStyles } from '../../../../styles/atisaStyles'
import { getClienteProcesoHitosPorFecha, ClienteProcesoHitoResumido } from '../../../../api/clienteProcesoHitos'
import { useAuth } from '../../../../modules/auth/core/Auth'
import SharedPagination from '../../../../components/pagination/SharedPagination'
import CumplimentarHitosMasivoModal from './CumplimentarHitosMasivoModal'

type Props = {
    show: boolean
    onHide: () => void
    onSuccess: (message: string) => void
    onError: (message: string) => void
}

const CumplimientoMasivoModal: FC<Props> = ({ show, onHide, onSuccess, onError }) => {
    const { currentUser } = useAuth()
    const [loadingData, setLoadingData] = useState(false)

    // Filtros
    const [mes, setMes] = useState<number>(new Date().getMonth() + 1)
    const [anio, setAnio] = useState<number>(new Date().getFullYear())

    // Tabla y Paginación
    const [items, setItems] = useState<ClienteProcesoHitoResumido[]>([])
    const [totalItems, setTotalItems] = useState(0)
    const [page, setPage] = useState(1)
    const [limit] = useState(5)
    const [sortField, setSortField] = useState<string>('fecha_limite')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // Selección
    const [selectedIds, setSelectedIds] = useState<number[]>([])

    // Modal Cumplimentación Masiva
    const [showCumplimentarModal, setShowCumplimentarModal] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    // Resetear al abrir
    useEffect(() => {
        if (show) {
            const now = new Date()
            setMes(now.getMonth() + 1)
            setAnio(now.getFullYear())
            setSelectedIds([])
            setPage(1)
            setHasSearched(true)
        }
    }, [show])

    // Cargar datos (reactivo a filtros y paginación)
    useEffect(() => {
        if (show && hasSearched) {
            loadData(anio, mes, page, limit, sortField, sortDirection)
        }
    }, [page, sortField, sortDirection, mes, anio, show, hasSearched])

    const loadData = async (pAnio: number, pMes: number, pPage: number, pLimit: number, pSort: string, pOrder: 'asc' | 'desc') => {
        setLoadingData(true)
        try {
            const response = await getClienteProcesoHitosPorFecha(pAnio, pMes, pPage, pLimit, pSort, pOrder)
            setItems(response.items || [])
            setTotalItems(response.total || 0)
        } catch (error) {
            console.error(error)
            onError('Error al cargar los datos')
            setItems([])
            setTotalItems(0)
        } finally {
            setLoadingData(false)
        }
    }

    const handleResetFecha = () => {
        const now = new Date()
        setMes(now.getMonth() + 1)
        setAnio(now.getFullYear())
        setPage(1)
    }

    const handleMesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setMes(Number(e.target.value))
        setPage(1)
    }

    const handleAnioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAnio(Number(e.target.value))
        setPage(1)
    }



    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const onSelectRow = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(x => x !== id))
        } else {
            setSelectedIds([...selectedIds, id])
        }
    }

    const onSelectAll = (checked: boolean) => {
        if (checked) {
            const visibleIds = items.map(i => i.id)
            const newIds = [...selectedIds]
            visibleIds.forEach(id => {
                if (!newIds.includes(id)) newIds.push(id)
            })
            setSelectedIds(newIds)
        } else {
            const visibleIds = items.map(i => i.id)
            setSelectedIds(selectedIds.filter(id => !visibleIds.includes(id)))
        }
    }

    const areAllVisibleSelected = items.length > 0 && items.every(i => selectedIds.includes(i.id))

    const handleMassSuccess = (count: number) => {
        onSuccess(`Se han cumplimentado ${count} hitos correctamente`)
        onHide()
    }

    const getSortIcon = (field: string) => {
        if (sortField !== field) return <i className='bi bi-arrow-down-up ms-1 text-muted' style={{ fontSize: '10px' }}></i>
        return <i className={`bi ${sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'} ms-1 text-white`} style={{ fontSize: '12px' }}></i>
    }

    return (
        <>
            <Modal
                show={show}
                onHide={onHide}
                size="xl"
                style={{ fontFamily: atisaStyles.fonts.secondary }}
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
                    <Modal.Title style={{
                        fontFamily: atisaStyles.fonts.primary,
                        fontWeight: 'bold',
                        color: 'white',
                        fontSize: '1.5rem',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <i className="bi bi-check-all me-2 text-white"></i>
                        Cumplimiento Masivo de Hitos
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

                <Modal.Body style={{ backgroundColor: 'white', padding: '24px' }}>
                    {/* Filtros estilo ProcesoHitosMaestro */}
                    <div
                        style={{
                            backgroundColor: '#f8f9fa',
                            padding: '16px 20px',
                            borderRadius: '8px',
                            border: `1px solid ${atisaStyles.colors.light}`,
                            marginBottom: '20px'
                        }}
                    >
                        <div className="row g-3 align-items-end">
                            <div className="col-md-3">
                                <label className="form-label fw-bold" style={{ color: atisaStyles.colors.primary }}>Mes</label>
                                <select
                                    className="form-select form-select-solid"
                                    value={mes}
                                    onChange={handleMesChange}
                                    style={{
                                        border: `1px solid ${atisaStyles.colors.light}`,
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(0, i).toLocaleString('es', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label fw-bold" style={{ color: atisaStyles.colors.primary }}>Año</label>
                                <input
                                    type="number"
                                    className="form-control form-control-solid"
                                    value={anio}
                                    onChange={handleAnioChange}
                                    style={{
                                        border: `1px solid ${atisaStyles.colors.light}`,
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div className="col-md-3">
                                <button
                                    className="btn w-100"
                                    onClick={handleResetFecha}
                                    disabled={loadingData}
                                    style={{
                                        backgroundColor: atisaStyles.colors.secondary,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                                        e.currentTarget.style.transform = 'translateY(0)'
                                    }}
                                >
                                    {loadingData ? 'Cargando...' : <><i className="bi bi-calendar-event me-2 text-white"></i>Mes Actual</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Contador */}
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
                            <i className="bi bi-check-circle me-2"></i>
                            Hitos seleccionados: {selectedIds.length}
                        </span>
                        <div className="d-flex gap-2">
                            {items.length > 0 && selectedIds.length < items.length && (
                                <button
                                    type="button"
                                    className="btn btn-sm"
                                    onClick={() => onSelectAll(true)}
                                    style={{
                                        backgroundColor: atisaStyles.colors.accent,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        padding: '4px 8px',
                                    }}
                                >
                                    <i className="bi bi-check-all me-1"></i>
                                    Todos
                                </button>
                            )}
                            {selectedIds.length > 0 && (
                                <button
                                    type="button"
                                    className="btn btn-sm"
                                    onClick={() => onSelectAll(false)}
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

                    {/* Tabla estilo ProcesoHitosMaestro */}
                    <div className="table-responsive"
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
                            border: `1px solid ${atisaStyles.colors.light}`,
                            overflow: 'hidden'
                        }}
                    >
                        <table className="table align-middle table-row-dashed fs-6 gy-5 mb-0"
                            style={{ fontFamily: atisaStyles.fonts.secondary, margin: 0 }}
                        >
                            <thead>
                                <tr style={{ backgroundColor: atisaStyles.colors.primary, color: 'white' }}>
                                    <th style={{ width: '50px', padding: '16px 12px', border: 'none' }}>
                                        <div className="form-check form-check-sm form-check-custom form-check-solid">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={areAllVisibleSelected}
                                                onChange={(e) => onSelectAll(e.target.checked)}
                                                disabled={items.length === 0}
                                                style={{
                                                    borderColor: 'white',
                                                    backgroundColor: areAllVisibleSelected ? atisaStyles.colors.secondary : 'transparent'
                                                }}
                                            />
                                        </div>
                                    </th>
                                    <th className="cursor-pointer" onClick={() => handleSort('cliente')} style={{ padding: '16px 12px', border: 'none', color: 'white', fontWeight: 'bold' }}>
                                        Cliente {getSortIcon('cliente')}
                                    </th>
                                    <th className="cursor-pointer" onClick={() => handleSort('proceso')} style={{ padding: '16px 12px', border: 'none', color: 'white', fontWeight: 'bold' }}>
                                        Proceso {getSortIcon('proceso')}
                                    </th>
                                    <th className="cursor-pointer" onClick={() => handleSort('hito')} style={{ padding: '16px 12px', border: 'none', color: 'white', fontWeight: 'bold' }}>
                                        Hito {getSortIcon('hito')}
                                    </th>
                                    <th className="cursor-pointer" onClick={() => handleSort('estado')} style={{ padding: '16px 12px', border: 'none', color: 'white', fontWeight: 'bold' }}>
                                        Estado {getSortIcon('estado')}
                                    </th>
                                    <th className="cursor-pointer" onClick={() => handleSort('fecha_limite')} style={{ padding: '16px 12px', border: 'none', color: 'white', fontWeight: 'bold' }}>
                                        Fecha Límite {getSortIcon('fecha_limite')}
                                    </th>
                                    <th style={{ padding: '16px 12px', border: 'none', color: 'white', fontWeight: 'bold' }}>
                                        Hora Límite
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: atisaStyles.colors.dark }}>
                                            <i className="bi bi-inbox" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}></i>
                                            {hasSearched ? 'No se encontraron registros' : 'Realiza una búsqueda para ver los resultados'}
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            style={{
                                                backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer'
                                            }}
                                            onClick={(e) => {
                                                if ((e.target as HTMLElement).tagName !== 'INPUT') {
                                                    onSelectRow(item.id)
                                                }
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
                                            <td style={{ padding: '16px 12px' }}>
                                                <div className="form-check form-check-sm form-check-custom form-check-solid">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={selectedIds.includes(item.id)}
                                                        onChange={(e) => onSelectRow(item.id)}
                                                        style={{
                                                            borderColor: atisaStyles.colors.primary,
                                                            backgroundColor: selectedIds.includes(item.id) ? atisaStyles.colors.secondary : 'transparent'
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 12px', fontWeight: '600', color: atisaStyles.colors.primary }}>{item.cliente}</td>
                                            <td style={{ padding: '16px 12px', color: atisaStyles.colors.dark }}>{item.proceso}</td>
                                            <td style={{ padding: '16px 12px', color: atisaStyles.colors.dark }}>{item.hito}</td>
                                            <td style={{ padding: '16px 12px' }}>
                                                <span className={`badge badge-light-${item.estado === 'Nuevo' ? 'warning' :
                                                    item.estado === 'Finalizado' ? 'success' :
                                                        item.estado === 'Cancelado' ? 'danger' : 'primary'
                                                    } fw-bold`}>
                                                    {item.estado === 'Nuevo' ? 'Pendiente' : item.estado}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 12px', color: atisaStyles.colors.dark }}>{item.fecha_limite}</td>
                                            <td style={{ padding: '16px 12px', color: atisaStyles.colors.dark }}>{item.hora_limite ? item.hora_limite.slice(0, 5) : '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalItems > 0 && (
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            padding: '16px 20px',
                            borderRadius: '8px',
                            marginTop: '20px'
                        }}>
                            <SharedPagination
                                currentPage={page}
                                totalItems={totalItems}
                                pageSize={limit}
                                onPageChange={setPage}
                            />
                        </div>
                    )}

                </Modal.Body>

                <Modal.Footer
                    style={{
                        backgroundColor: '#f8f9fa',
                        border: 'none',
                        borderRadius: '0 0 12px 12px',
                        padding: '20px 24px'
                    }}
                >
                    <button
                        type="button"
                        className="btn"
                        onClick={onHide}
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
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn"
                        onClick={() => setShowCumplimentarModal(true)}
                        disabled={selectedIds.length === 0}
                        style={{
                            backgroundColor: selectedIds.length === 0 ? '#6c757d' : atisaStyles.colors.secondary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontFamily: atisaStyles.fonts.secondary,
                            fontWeight: '600',
                            padding: '10px 20px',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            marginLeft: '12px'
                        }}
                        onMouseEnter={(e) => {
                            if (selectedIds.length > 0) {
                                e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                                e.currentTarget.style.transform = 'translateY(-2px)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (selectedIds.length > 0) {
                                e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                                e.currentTarget.style.transform = 'translateY(0)'
                            }
                        }}
                    >
                        <i className="bi bi-file-earmark-check me-2"></i>
                        Cumplimentar {selectedIds.length} Hitos
                    </button>
                </Modal.Footer>
            </Modal>

            {showCumplimentarModal && (
                <CumplimentarHitosMasivoModal
                    show={showCumplimentarModal}
                    onHide={() => setShowCumplimentarModal(false)}
                    ids={selectedIds}
                    onSuccess={handleMassSuccess}
                />
            )}
        </>
    )
}

export default CumplimientoMasivoModal
