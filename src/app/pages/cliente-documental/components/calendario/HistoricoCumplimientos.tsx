import { FC, useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { atisaStyles } from '../../../../styles/atisaStyles'
import SharedPagination from '../../../../components/pagination/SharedPagination'
import { getClienteProcesoHitoCumplimientosByCliente, ClienteProcesoHitoCumplimiento } from '../../../../api/clienteProcesoHitoCumplimientos'
import { Cliente, getClienteById } from '../../../../api/clientes'
import { getAllHitos } from '../../../../api/hitos'
import { getAllProcesos } from '../../../../api/procesos'

// Extendemos la interfaz para incluir los campos adicionales que devuelve el endpoint
interface CumplimientoHistorico extends ClienteProcesoHitoCumplimiento {
    proceso?: string
    hito?: string
    fecha_limite?: string
    hora_limite?: string
    proceso_id?: number
    hito_id?: number
}

interface Props {
    clienteId: string
}

const HistoricoCumplimientos: FC<Props> = ({ clienteId }) => {
    const navigate = useNavigate()
    const [cliente, setCliente] = useState<Cliente | null>(null)
    const [cumplimientos, setCumplimientos] = useState<CumplimientoHistorico[]>([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [searching, setSearching] = useState(false)
    const [selectedHito, setSelectedHito] = useState('')
    const [selectedProceso, setSelectedProceso] = useState('')
    const [fechaDesde, setFechaDesde] = useState('')
    const [fechaHasta, setFechaHasta] = useState('')
    const [tipoFiltroFecha, setTipoFiltroFecha] = useState<'cumplimiento' | 'creacion' | 'limite'>('cumplimiento')
    const [hitos, setHitos] = useState<any[]>([])
    const [procesos, setProcesos] = useState<any[]>([])
    const [showFilters, setShowFilters] = useState(false)

    // Función para cargar cumplimientos
    const cargarCumplimientos = async (page: number = 1) => {
        setLoading(true)
        try {
            const response = await getClienteProcesoHitoCumplimientosByCliente(
                clienteId,
                page,
                itemsPerPage,
                'fecha',
                'desc'
            )
            setCumplimientos(response.cumplimientos || [])
            setTotal(response.total || 0)
        } catch (error) {
            console.error('Error cargando cumplimientos:', error)
            setCumplimientos([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    // Debounce para el término de búsqueda
    useEffect(() => {
        if (searchTerm) {
            setSearching(true)
        }

        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
            setSearching(false)
        }, 300) // 300ms de delay

        return () => {
            clearTimeout(timer)
            setSearching(false)
        }
    }, [searchTerm])

    // Cargar datos iniciales
    useEffect(() => {
        if (clienteId) {
            getClienteById(clienteId).then(setCliente)
            cargarCumplimientos(currentPage)
            cargarHitos()
            cargarProcesos()
        }
    }, [clienteId, currentPage])

    // Cargar hitos
    const cargarHitos = async () => {
        try {
            const response = await getAllHitos()
            setHitos(response.hitos || [])
        } catch (error) {
            console.error('Error cargando hitos:', error)
        }
    }

    // Cargar procesos
    const cargarProcesos = async () => {
        try {
            const response = await getAllProcesos()
            setProcesos(response.procesos || [])
        } catch (error) {
            console.error('Error cargando procesos:', error)
        }
    }

    const formatDate = (date: string) => {
        const d = new Date(date)
        return d.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }


    const formatTime = (time: string) => {
        if (!time) return '-'

        // Si ya está en formato HH:MM, devolverlo tal como está
        if (time.match(/^\d{2}:\d{2}$/)) {
            return time
        }

        // Si viene en formato HH:MM:SS, quitar los segundos
        if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
            return time.substring(0, 5)
        }

        return time
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    // Función para limpiar filtros
    const limpiarFiltros = () => {
        setSearchTerm('')
        setSelectedHito('')
        setSelectedProceso('')
        setFechaDesde('')
        setFechaHasta('')
        setTipoFiltroFecha('cumplimiento')
        setCurrentPage(1)
    }


    // Filtrar cumplimientos usando useMemo para optimizar el rendimiento
    const cumplimientosFiltrados = useMemo(() => {
        return cumplimientos.filter(cumplimiento => {
            const matchesSearch = !debouncedSearchTerm ||
                cumplimiento.proceso?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                cumplimiento.hito?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                cumplimiento.usuario?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                cumplimiento.observacion?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

            const matchesHito = !selectedHito || cumplimiento.hito_id?.toString() === selectedHito
            const matchesProceso = !selectedProceso || cumplimiento.proceso_id?.toString() === selectedProceso

            let matchesFecha = true
            if (fechaDesde || fechaHasta) {
                let fechaAComparar: Date | null = null

                // Determinar qué fecha usar según el tipo de filtro
                switch (tipoFiltroFecha) {
                    case 'cumplimiento':
                        fechaAComparar = cumplimiento.fecha ? new Date(cumplimiento.fecha) : null
                        break
                    case 'creacion':
                        fechaAComparar = cumplimiento.fecha_creacion ? new Date(cumplimiento.fecha_creacion) : null
                        break
                    case 'limite':
                        fechaAComparar = cumplimiento.fecha_limite ? new Date(cumplimiento.fecha_limite) : null
                        break
                }

                if (fechaAComparar && !isNaN(fechaAComparar.getTime())) {
                    if (fechaDesde) {
                        const fechaDesdeDate = new Date(fechaDesde)
                        matchesFecha = matchesFecha && fechaAComparar >= fechaDesdeDate
                    }
                    if (fechaHasta) {
                        const fechaHastaDate = new Date(fechaHasta)
                        matchesFecha = matchesFecha && fechaAComparar <= fechaHastaDate
                    }
                } else {
                    // Si no hay fecha válida para el tipo seleccionado, no mostrar el registro
                    matchesFecha = false
                }
            }

            return matchesSearch && matchesHito && matchesProceso && matchesFecha
        })
    }, [cumplimientos, debouncedSearchTerm, selectedHito, selectedProceso, fechaDesde, fechaHasta, tipoFiltroFecha])

    return (
        <div
            className="container-fluid py-5"
            style={{
                fontFamily: atisaStyles.fonts.secondary,
                backgroundColor: '#f8f9fa',
                minHeight: '100vh'
            }}
        >
            {/* Header */}
            <div
                style={{
                    backgroundColor: atisaStyles.colors.primary,
                    color: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 80, 92, 0.15)',
                    marginBottom: '2rem',
                    textAlign: 'center'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                        <h2
                            style={{
                                fontFamily: atisaStyles.fonts.primary,
                                fontWeight: 'bold',
                                color: 'white',
                                margin: 0,
                                fontSize: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px'
                            }}
                        >
                            <i className="bi bi-clock-history" style={{ color: 'white' }}></i>
                            Histórico de Cumplimientos
                        </h2>
                        <p
                            style={{
                                margin: '8px 0 0 0',
                                fontSize: '1.1rem',
                                opacity: 0.9
                            }}
                        >
                            {cliente?.razsoc || clienteId}
                        </p>
                    </div>

                    <button
                        className="btn"
                        onClick={() => navigate(`/cliente-calendario/${clienteId}`)}
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '8px',
                            fontFamily: atisaStyles.fonts.secondary,
                            fontWeight: '600',
                            padding: '12px 20px',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                            e.currentTarget.style.transform = 'translateY(0)'
                        }}
                    >
                        <i className="bi bi-calendar3" style={{ color: 'white' }}></i>
                        Ver Calendario
                    </button>
                </div>
            </div>

            {/* Panel de filtros */}
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
                    border: `1px solid ${atisaStyles.colors.light}`,
                    marginBottom: '2rem',
                    overflow: 'hidden'
                }}
            >
                <div
                    style={{
                        padding: '1.5rem',
                        borderBottom: `1px solid ${atisaStyles.colors.light}`,
                        backgroundColor: atisaStyles.colors.light
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3
                            style={{
                                fontFamily: atisaStyles.fonts.primary,
                                color: atisaStyles.colors.primary,
                                fontWeight: 'bold',
                                margin: 0,
                                fontSize: '1.3rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <i className="bi bi-funnel" style={{ color: atisaStyles.colors.primary }}></i>
                            Filtros de Búsqueda
                        </h3>
                        <button
                            className="btn btn-sm"
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                                backgroundColor: atisaStyles.colors.accent,
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontFamily: atisaStyles.fonts.secondary,
                                fontWeight: '600',
                                padding: '8px 16px',
                                fontSize: '12px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                e.currentTarget.style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            <i className={`bi ${showFilters ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                            {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div style={{ padding: '1.5rem' }}>
                        <div className="row g-3">
                            {/* Búsqueda por texto */}
                            <div className="col-md-6">
                                <label
                                    style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        fontWeight: '600',
                                        color: atisaStyles.colors.primary,
                                        marginBottom: '8px',
                                        display: 'block'
                                    }}
                                >
                                    <i className="bi bi-search me-2"></i>
                                    Buscar por nombre, proceso, hito o usuario
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Escriba para buscar..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            fontFamily: atisaStyles.fonts.secondary,
                                            fontSize: '14px',
                                            padding: '12px 16px',
                                            height: '48px',
                                            border: `2px solid ${atisaStyles.colors.light}`,
                                            borderRadius: '8px',
                                            transition: 'all 0.3s ease',
                                            backgroundColor: 'white',
                                            paddingRight: searching ? '50px' : '16px'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = atisaStyles.colors.accent
                                            e.target.style.boxShadow = `0 0 0 3px ${atisaStyles.colors.accent}20`
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = atisaStyles.colors.light
                                            e.target.style.boxShadow = 'none'
                                        }}
                                    />
                                    {searching && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                zIndex: 10
                                            }}
                                        >
                                            <div
                                                className="spinner-border spinner-border-sm"
                                                role="status"
                                                style={{
                                                    color: atisaStyles.colors.primary,
                                                    width: '20px',
                                                    height: '20px'
                                                }}
                                            >
                                                <span className="visually-hidden">Buscando...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Filtro por hito */}
                            <div className="col-md-3">
                                <label
                                    style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        fontWeight: '600',
                                        color: atisaStyles.colors.primary,
                                        marginBottom: '8px',
                                        display: 'block'
                                    }}
                                >
                                    <i className="bi bi-flag me-2"></i>
                                    Hito
                                </label>
                                <select
                                    className="form-select"
                                    value={selectedHito}
                                    onChange={(e) => setSelectedHito(e.target.value)}
                                    style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        fontSize: '14px',
                                        padding: '12px 16px',
                                        height: '48px',
                                        border: `2px solid ${atisaStyles.colors.light}`,
                                        borderRadius: '8px',
                                        transition: 'all 0.3s ease',
                                        backgroundColor: 'white'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = atisaStyles.colors.accent
                                        e.target.style.boxShadow = `0 0 0 3px ${atisaStyles.colors.accent}20`
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = atisaStyles.colors.light
                                        e.target.style.boxShadow = 'none'
                                    }}
                                >
                                    <option value="">Todos los hitos</option>
                                    {hitos.map((hito) => (
                                        <option key={hito.id} value={hito.id}>
                                            {hito.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por proceso */}
                            <div className="col-md-3">
                                <label
                                    style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        fontWeight: '600',
                                        color: atisaStyles.colors.primary,
                                        marginBottom: '8px',
                                        display: 'block'
                                    }}
                                >
                                    <i className="bi bi-diagram-3 me-2"></i>
                                    Proceso
                                </label>
                                <select
                                    className="form-select"
                                    value={selectedProceso}
                                    onChange={(e) => setSelectedProceso(e.target.value)}
                                    style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        fontSize: '14px',
                                        padding: '12px 16px',
                                        height: '48px',
                                        border: `2px solid ${atisaStyles.colors.light}`,
                                        borderRadius: '8px',
                                        transition: 'all 0.3s ease',
                                        backgroundColor: 'white'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = atisaStyles.colors.accent
                                        e.target.style.boxShadow = `0 0 0 3px ${atisaStyles.colors.accent}20`
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = atisaStyles.colors.light
                                        e.target.style.boxShadow = 'none'
                                    }}
                                >
                                    <option value="">Todos los procesos</option>
                                    {procesos.map((proceso) => (
                                        <option key={proceso.id} value={proceso.id}>
                                            {proceso.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selector de tipo de fecha */}
                            <div className="col-md-3">
                                <label
                                    style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        fontWeight: '600',
                                        color: atisaStyles.colors.primary,
                                        marginBottom: '8px',
                                        display: 'block'
                                    }}
                                >
                                    <i className="bi bi-calendar-check me-2"></i>
                                    Filtrar por fecha de
                                </label>
                                <select
                                    className="form-select"
                                    value={tipoFiltroFecha}
                                    onChange={(e) => setTipoFiltroFecha(e.target.value as 'cumplimiento' | 'creacion' | 'limite')}
                                    style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        fontSize: '14px',
                                        padding: '12px 16px',
                                        height: '48px',
                                        border: `2px solid ${atisaStyles.colors.light}`,
                                        borderRadius: '8px',
                                        transition: 'all 0.3s ease',
                                        backgroundColor: 'white'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = atisaStyles.colors.accent
                                        e.target.style.boxShadow = `0 0 0 3px ${atisaStyles.colors.accent}20`
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = atisaStyles.colors.light
                                        e.target.style.boxShadow = 'none'
                                    }}
                                >
                                    <option value="cumplimiento">Cumplimiento</option>
                                    <option value="creacion">Creación</option>
                                    <option value="limite">Límite del Hito</option>
                                </select>
                            </div>

                            {/* Filtro por fecha desde */}
                            <div className="col-md-3">
                                <label
                                    style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        fontWeight: '600',
                                        color: atisaStyles.colors.primary,
                                        marginBottom: '8px',
                                        display: 'block'
                                    }}
                                >
                                    <i className="bi bi-calendar-date me-2"></i>
                                    Fecha desde
                                </label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={fechaDesde}
                                    onChange={(e) => setFechaDesde(e.target.value)}
                                    style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        fontSize: '14px',
                                        padding: '12px 16px',
                                        height: '48px',
                                        border: `2px solid ${atisaStyles.colors.light}`,
                                        borderRadius: '8px',
                                        transition: 'all 0.3s ease',
                                        backgroundColor: 'white'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = atisaStyles.colors.accent
                                        e.target.style.boxShadow = `0 0 0 3px ${atisaStyles.colors.accent}20`
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = atisaStyles.colors.light
                                        e.target.style.boxShadow = 'none'
                                    }}
                                />
                            </div>

                            {/* Filtro por fecha hasta */}
                            <div className="col-md-3">
                                <label
                                    style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        fontWeight: '600',
                                        color: atisaStyles.colors.primary,
                                        marginBottom: '8px',
                                        display: 'block'
                                    }}
                                >
                                    <i className="bi bi-calendar-date me-2"></i>
                                    Fecha hasta
                                </label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={fechaHasta}
                                    onChange={(e) => setFechaHasta(e.target.value)}
                                    style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        fontSize: '14px',
                                        padding: '12px 16px',
                                        height: '48px',
                                        border: `2px solid ${atisaStyles.colors.light}`,
                                        borderRadius: '8px',
                                        transition: 'all 0.3s ease',
                                        backgroundColor: 'white'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = atisaStyles.colors.accent
                                        e.target.style.boxShadow = `0 0 0 3px ${atisaStyles.colors.accent}20`
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = atisaStyles.colors.light
                                        e.target.style.boxShadow = 'none'
                                    }}
                                />
                            </div>

                            {/* Botón de limpiar filtros */}
                            <div className="col-md-6">
                                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                    <button
                                        className="btn"
                                        onClick={limpiarFiltros}
                                        style={{
                                            backgroundColor: 'transparent',
                                            color: atisaStyles.colors.primary,
                                            border: `2px solid ${atisaStyles.colors.primary}`,
                                            borderRadius: '8px',
                                            fontFamily: atisaStyles.fonts.secondary,
                                            fontWeight: '600',
                                            padding: '12px 24px',
                                            fontSize: '14px',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                            e.currentTarget.style.color = 'white'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent'
                                            e.currentTarget.style.color = atisaStyles.colors.primary
                                        }}
                                    >
                                        <i className="bi bi-arrow-clockwise"></i>
                                        Limpiar Filtros
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabla de cumplimientos */}
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
                    border: `1px solid ${atisaStyles.colors.light}`,
                    overflow: 'hidden'
                }}
            >
                <div
                    style={{
                        padding: '1.5rem',
                        borderBottom: `1px solid ${atisaStyles.colors.light}`,
                        backgroundColor: atisaStyles.colors.light
                    }}
                >
                    <h3
                        style={{
                            fontFamily: atisaStyles.fonts.primary,
                            color: atisaStyles.colors.primary,
                            fontWeight: 'bold',
                            margin: 0,
                            fontSize: '1.3rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <i className="bi bi-list-ul" style={{ color: atisaStyles.colors.primary }}></i>
                        Listado de Cumplimientos
                    </h3>
                </div>

                <div className="table-responsive">
                    <table
                        className="table table-hover"
                        style={{
                            fontFamily: atisaStyles.fonts.secondary,
                            margin: 0
                        }}
                    >
                        <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                            <tr
                                style={{
                                    backgroundColor: atisaStyles.colors.primary,
                                    color: 'white',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                }}
                            >
                                <th
                                    style={{
                                        fontFamily: atisaStyles.fonts.primary,
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        padding: '16px 12px',
                                        border: 'none',
                                        color: 'white'
                                    }}
                                >
                                    Fecha Cumplimiento
                                </th>
                                <th
                                    style={{
                                        fontFamily: atisaStyles.fonts.primary,
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        padding: '16px 12px',
                                        border: 'none',
                                        color: 'white'
                                    }}
                                >
                                    Hora Cumplimiento
                                </th>
                                <th
                                    style={{
                                        fontFamily: atisaStyles.fonts.primary,
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        padding: '16px 12px',
                                        border: 'none',
                                        color: 'white'
                                    }}
                                >
                                    Fecha Límite Hito
                                </th>
                                <th
                                    style={{
                                        fontFamily: atisaStyles.fonts.primary,
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        padding: '16px 12px',
                                        border: 'none',
                                        color: 'white'
                                    }}
                                >
                                    Hora Límite Hito
                                </th>
                                <th
                                    style={{
                                        fontFamily: atisaStyles.fonts.primary,
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        padding: '16px 12px',
                                        border: 'none',
                                        color: 'white'
                                    }}
                                >
                                    Usuario
                                </th>
                                <th
                                    style={{
                                        fontFamily: atisaStyles.fonts.primary,
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        padding: '16px 12px',
                                        border: 'none',
                                        color: 'white'
                                    }}
                                >
                                    Proceso
                                </th>
                                <th
                                    style={{
                                        fontFamily: atisaStyles.fonts.primary,
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        padding: '16px 12px',
                                        border: 'none',
                                        color: 'white'
                                    }}
                                >
                                    Hito
                                </th>
                                <th
                                    style={{
                                        fontFamily: atisaStyles.fonts.primary,
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        padding: '16px 12px',
                                        border: 'none',
                                        color: 'white'
                                    }}
                                >
                                    Observación
                                </th>
                                <th
                                    style={{
                                        fontFamily: atisaStyles.fonts.primary,
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        padding: '16px 12px',
                                        border: 'none',
                                        color: 'white'
                                    }}
                                >
                                    Fecha / Hora Creación
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="text-center py-4"
                                        style={{
                                            backgroundColor: '#f8f9fa',
                                            fontFamily: atisaStyles.fonts.secondary,
                                            padding: '2rem'
                                        }}
                                    >
                                        <div
                                            className="spinner-border"
                                            role="status"
                                            style={{
                                                color: atisaStyles.colors.primary,
                                                width: '2rem',
                                                height: '2rem'
                                            }}
                                        >
                                            <span className="visually-hidden">Cargando cumplimientos...</span>
                                        </div>
                                        <span
                                            className="ms-2"
                                            style={{
                                                color: atisaStyles.colors.dark,
                                                fontFamily: atisaStyles.fonts.secondary,
                                                fontWeight: '500'
                                            }}
                                        >
                                            Cargando cumplimientos...
                                        </span>
                                    </td>
                                </tr>
                            ) : cumplimientosFiltrados.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="text-center py-4"
                                        style={{
                                            backgroundColor: '#f8f9fa',
                                            fontFamily: atisaStyles.fonts.secondary,
                                            padding: '2rem',
                                            color: atisaStyles.colors.dark
                                        }}
                                    >
                                        <i className="bi bi-info-circle me-2" style={{ color: atisaStyles.colors.dark }}></i>
                                        {debouncedSearchTerm || selectedHito || selectedProceso || fechaDesde || fechaHasta
                                            ? 'No se encontraron cumplimientos con los filtros aplicados'
                                            : 'No hay cumplimientos registrados para este cliente'
                                        }
                                    </td>
                                </tr>
                            ) : (
                                cumplimientosFiltrados.map((cumplimiento, index) => (
                                    <tr
                                        key={cumplimiento.id}
                                        style={{
                                            backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#e9ecef'
                                            e.currentTarget.style.transform = 'translateY(-1px)'
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 80, 92, 0.1)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa'
                                            e.currentTarget.style.transform = 'translateY(0)'
                                            e.currentTarget.style.boxShadow = 'none'
                                        }}
                                    >
                                        <td
                                            style={{
                                                fontFamily: atisaStyles.fonts.secondary,
                                                color: atisaStyles.colors.primary,
                                                fontWeight: '600',
                                                padding: '16px 12px'
                                            }}
                                        >
                                            {formatDate(cumplimiento.fecha)}
                                        </td>
                                        <td
                                            style={{
                                                fontFamily: atisaStyles.fonts.secondary,
                                                color: atisaStyles.colors.dark,
                                                padding: '16px 12px'
                                            }}
                                        >
                                            {formatTime(cumplimiento.hora)}
                                        </td>
                                        <td
                                            style={{
                                                fontFamily: atisaStyles.fonts.secondary,
                                                color: atisaStyles.colors.primary,
                                                fontWeight: '600',
                                                padding: '16px 12px'
                                            }}
                                        >
                                            <span
                                                style={{
                                                    backgroundColor: '#e8f5e8',
                                                    color: '#2e7d32',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    border: '1px solid #c8e6c9',
                                                    boxShadow: '0 1px 3px rgba(46, 125, 50, 0.1)'
                                                }}
                                                title={cumplimiento.fecha_limite ? formatDate(cumplimiento.fecha_limite) : 'No disponible'}
                                            >
                                                {cumplimiento.fecha_limite ? formatDate(cumplimiento.fecha_limite) : 'No disponible'}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                fontFamily: atisaStyles.fonts.secondary,
                                                color: atisaStyles.colors.dark,
                                                padding: '16px 12px'
                                            }}
                                        >
                                            <span
                                                style={{
                                                    backgroundColor: '#fff3e0',
                                                    color: '#f57c00',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    border: '1px solid #ffcc02',
                                                    boxShadow: '0 1px 3px rgba(245, 124, 0, 0.1)'
                                                }}
                                                title={cumplimiento.hora_limite ? formatTime(cumplimiento.hora_limite) : 'No disponible'}
                                            >
                                                {cumplimiento.hora_limite ? formatTime(cumplimiento.hora_limite) : 'No disponible'}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                fontFamily: atisaStyles.fonts.secondary,
                                                color: atisaStyles.colors.dark,
                                                padding: '16px 12px'
                                            }}
                                        >
                                            <span
                                                style={{
                                                    backgroundColor: atisaStyles.colors.light,
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                {cumplimiento.usuario}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                fontFamily: atisaStyles.fonts.secondary,
                                                color: atisaStyles.colors.dark,
                                                padding: '16px 12px'
                                            }}
                                        >
                                            <span title={cumplimiento.proceso || 'No disponible'}>
                                                {cumplimiento.proceso || 'No disponible'}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                fontFamily: atisaStyles.fonts.secondary,
                                                color: atisaStyles.colors.primary,
                                                fontWeight: '600',
                                                padding: '16px 12px'
                                            }}
                                        >
                                            <span title={cumplimiento.hito || 'No disponible'}>
                                                {cumplimiento.hito || 'No disponible'}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                fontFamily: atisaStyles.fonts.secondary,
                                                color: atisaStyles.colors.dark,
                                                padding: '16px 12px'
                                            }}
                                        >
                                            {cumplimiento.observacion ? (
                                                <span
                                                    style={{
                                                        backgroundColor: '#e3f2fd',
                                                        color: '#1976d2',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}
                                                    title={cumplimiento.observacion}
                                                >
                                                    {cumplimiento.observacion.length > 50
                                                        ? `${cumplimiento.observacion.substring(0, 50)}...`
                                                        : cumplimiento.observacion
                                                    }
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        color: '#6c757d',
                                                        fontStyle: 'italic',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    Sin observación
                                                </span>
                                            )}
                                        </td>
                                        <td
                                            style={{
                                                fontFamily: atisaStyles.fonts.secondary,
                                                color: atisaStyles.colors.primary,
                                                fontWeight: '600',
                                                padding: '16px 12px'
                                            }}
                                        >
                                            <span
                                                style={{
                                                    backgroundColor: '#f3e5f5',
                                                    color: '#7b1fa2',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    border: '1px solid #e1bee7',
                                                    boxShadow: '0 1px 3px rgba(123, 31, 162, 0.1)'
                                                }}
                                                title={cumplimiento.fecha_creacion ? new Date(cumplimiento.fecha_creacion).toLocaleString('es-ES', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit'
                                                }) : 'No disponible'}
                                            >
                                                {cumplimiento.fecha_creacion ? new Date(cumplimiento.fecha_creacion).toLocaleString('es-ES', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit'
                                                }) : 'No disponible'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {cumplimientosFiltrados.length > itemsPerPage && (
                    <div
                        style={{
                            padding: '1.5rem',
                            borderTop: `1px solid ${atisaStyles.colors.light}`,
                            backgroundColor: '#f8f9fa'
                        }}
                    >
                        <SharedPagination
                            currentPage={currentPage}
                            totalItems={cumplimientosFiltrados.length}
                            pageSize={itemsPerPage}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

export default HistoricoCumplimientos
