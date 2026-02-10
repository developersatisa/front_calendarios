import { FC, useEffect, useState, useMemo } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { atisaStyles, getSecondaryButtonStyles } from '../../../../styles/atisaStyles'
import SharedPagination from '../../../../components/pagination/SharedPagination'
import { getClienteProcesoHitoCumplimientosByCliente, ClienteProcesoHitoCumplimiento } from '../../../../api/clienteProcesoHitoCumplimientos'
import { Cliente, getClienteById } from '../../../../api/clientes'
import { getAllHitos, Hito } from '../../../../api/hitos'
import { getAllProcesos, Proceso } from '../../../../api/procesos'
import { descargarDocumentosCumplimiento } from '../../../../api/documentosCumplimiento'
import { getClienteProcesoHitoById, ClienteProcesoHito } from '../../../../api/clienteProcesoHitos'
import { getClienteProcesosByCliente } from '../../../../api/clienteProcesos'
import { getAllSubdepartamentos, Subdepartamento } from '../../../../api/subdepartamentos'

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
    const [hitos, setHitos] = useState<Hito[]>([])
    const [procesos, setProcesos] = useState<Proceso[]>([])
    const [subdepartamentos, setSubdepartamentos] = useState<Subdepartamento[]>([])
    const [selectedDepartamento, setSelectedDepartamento] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [downloadingCumplimientoId, setDownloadingCumplimientoId] = useState<number | null>(null)
    const [sortField, setSortField] = useState<'fecha_cumplimiento' | 'hora_cumplimiento' | 'fecha_limite' | 'hora_limite' | 'usuario' | 'proceso' | 'hito' | 'observacion' | 'fecha_creacion' | 'departamento'>('fecha_creacion')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

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
            const cumplimientosData = response.cumplimientos || []
            setCumplimientos(cumplimientosData)
            setTotal(response.total || 0)
        } catch (error) {
            console.error('Error cargando cumplimientos:', error)
            setCumplimientos([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    // Función para descargar documentos de un cumplimiento
    const handleDescargarDocumentos = async (cumplimientoId: number) => {
        try {
            setDownloadingCumplimientoId(cumplimientoId)
            const blob = await descargarDocumentosCumplimiento(cumplimientoId)

            // Crear URL del blob
            const url = window.URL.createObjectURL(blob)

            // Crear enlace temporal para descarga
            const link = document.createElement('a')
            link.href = url
            link.download = `documentos-cumplimiento-${cumplimientoId}.zip`
            link.style.display = 'none'

            // Agregar al DOM, hacer clic y limpiar
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Liberar la URL del blob
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error al descargar documentos:', error)
            alert('Error al descargar los documentos. Por favor, inténtalo de nuevo.')
        } finally {
            setDownloadingCumplimientoId(null)
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
        }
    }, [clienteId, currentPage])

    // Cargar hitos y procesos del cliente solo cuando cambia el clienteId
    useEffect(() => {
        if (clienteId) {
            cargarHitosYProcesosDelCliente()
            cargarSubdepartamentos()
        }
    }, [clienteId])

    // Cargar subdepartamentos para el filtro
    const cargarSubdepartamentos = async () => {
        try {
            const response = await getAllSubdepartamentos(undefined, 1000, undefined, 'asc')
            setSubdepartamentos(response.subdepartamentos || [])
        } catch (error) {
            console.error('Error cargando subdepartamentos:', error)
            setSubdepartamentos([])
        }
    }

    // Cargar hitos y procesos únicos del cliente basados en sus cumplimientos
    const cargarHitosYProcesosDelCliente = async () => {
        try {
            // Cargar todos los cumplimientos del cliente (sin paginación para obtener todos)
            const response = await getClienteProcesoHitoCumplimientosByCliente(
                clienteId,
                1,
                10000, // Límite alto para obtener todos
                'fecha',
                'desc'
            )

            const cumplimientosData = (response.cumplimientos || []) as CumplimientoHistorico[]

            if (cumplimientosData.length === 0) {
                setHitos([])
                setProcesos([])
                return
            }

            // Primero intentar usar los campos directos si existen
            const hitoIds = new Set<number>()
            const procesoIds = new Set<number>()

            cumplimientosData.forEach(cumplimiento => {
                const cumpl = cumplimiento as any
                if (cumpl.hito_id) {
                    hitoIds.add(cumpl.hito_id)
                }
                if (cumpl.proceso_id) {
                    procesoIds.add(cumpl.proceso_id)
                }
            })

            // Si no encontramos los campos directos, obtenerlos desde cliente_proceso_hito
            if (hitoIds.size === 0 || procesoIds.size === 0) {
                // Extraer cliente_proceso_hito_id únicos
                const clienteProcesoHitoIds = new Set<number>()
                cumplimientosData.forEach(cumplimiento => {
                    if (cumplimiento.cliente_proceso_hito_id) {
                        clienteProcesoHitoIds.add(cumplimiento.cliente_proceso_hito_id)
                    }
                })

                if (clienteProcesoHitoIds.size === 0) {
                    setHitos([])
                    setProcesos([])
                    return
                }

                // Obtener todos los cliente_proceso_hito en paralelo
                const clienteProcesoHitosPromises = Array.from(clienteProcesoHitoIds).map(id =>
                    getClienteProcesoHitoById(id)
                        .then(hito => ({ id, hito }))
                        .catch(error => {
                            console.warn(`Error obteniendo cliente_proceso_hito ${id}:`, error)
                            return null
                        })
                )

                const clienteProcesoHitosResults = await Promise.all(clienteProcesoHitosPromises)
                const clienteProcesoHitos = clienteProcesoHitosResults.filter((r): r is { id: number, hito: ClienteProcesoHito } => r !== null)

                if (clienteProcesoHitos.length === 0) {
                    setHitos([])
                    setProcesos([])
                    return
                }

                // Extraer hito_id únicos desde cliente_proceso_hito
                const clienteProcesoIds = new Set<number>()

                clienteProcesoHitos.forEach(({ hito }) => {
                    if (hito.hito_id) {
                        hitoIds.add(hito.hito_id)
                    }
                    if (hito.cliente_proceso_id) {
                        clienteProcesoIds.add(hito.cliente_proceso_id)
                    }
                })

                // Obtener procesos del cliente para mapear cliente_proceso_id a proceso_id
                const procesosCliente = await getClienteProcesosByCliente(clienteId)
                const procesoIdMap = new Map<number, number>()
                procesosCliente.clienteProcesos?.forEach(cp => {
                    procesoIdMap.set(cp.id, cp.proceso_id)
                })

                // Mapear cliente_proceso_id a proceso_id
                clienteProcesoIds.forEach(clienteProcesoId => {
                    const procesoId = procesoIdMap.get(clienteProcesoId)
                    if (procesoId) {
                        procesoIds.add(procesoId)
                    }
                })
            }

            // Cargar todos los hitos y procesos maestros
            const [hitosResponse, procesosResponse] = await Promise.all([
                getAllHitos(),
                getAllProcesos()
            ])

            // Filtrar solo los hitos y procesos que tiene el cliente
            const hitosFiltrados = (hitosResponse.hitos || []).filter((hito: Hito) => hitoIds.has(hito.id))
            const procesosFiltrados = (procesosResponse.procesos || []).filter((proceso: Proceso) => procesoIds.has(proceso.id))

            setHitos(hitosFiltrados)
            setProcesos(procesosFiltrados)
        } catch (error) {
            console.error('Error cargando hitos y procesos del cliente:', error)
            // En caso de error, cargar listas vacías
            setHitos([])
            setProcesos([])
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
        setSelectedDepartamento('')
        setFechaDesde('')
        setFechaHasta('')
        setTipoFiltroFecha('cumplimiento')
        setCurrentPage(1)
    }

    // Función para manejar el ordenamiento
    const handleSort = (field: 'fecha_cumplimiento' | 'hora_cumplimiento' | 'fecha_limite' | 'hora_limite' | 'usuario' | 'proceso' | 'hito' | 'observacion' | 'fecha_creacion' | 'departamento') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Función para obtener el icono de ordenamiento
    const getSortIcon = (field: 'fecha_cumplimiento' | 'hora_cumplimiento' | 'fecha_limite' | 'hora_limite' | 'usuario' | 'proceso' | 'hito' | 'observacion' | 'fecha_creacion' | 'departamento') => {
        if (sortField !== field) {
            return (
                <i
                    className="bi bi-arrow-down-up"
                    style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginLeft: '6px'
                    }}
                />
            )
        }
        return (
            <i
                className={`bi ${sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}`}
                style={{
                    fontSize: '12px',
                    color: 'white',
                    marginLeft: '6px',
                    fontWeight: 'bold'
                }}
            />
        )
    }

    // Función para ordenar los cumplimientos
    const sortCumplimientos = (cumplimientos: CumplimientoHistorico[]): CumplimientoHistorico[] => {
        const sorted = [...cumplimientos].sort((a, b) => {
            let comparison = 0

            switch (sortField) {
                case 'fecha_cumplimiento':
                    const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0
                    const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0
                    comparison = fechaA - fechaB
                    // Si las fechas son iguales, ordenar por hora
                    if (comparison === 0) {
                        const horaA = a.hora ? (a.hora.includes(':') ? a.hora : `${a.hora}:00`) : '00:00:00'
                        const horaB = b.hora ? (b.hora.includes(':') ? b.hora : `${b.hora}:00`) : '00:00:00'
                        const [hA, mA] = horaA.split(':').map(Number)
                        const [hB, mB] = horaB.split(':').map(Number)
                        comparison = (hA * 60 + mA) - (hB * 60 + mB)
                    }
                    break

                case 'hora_cumplimiento':
                    const horaCumplA = a.hora ? (a.hora.includes(':') ? a.hora : `${a.hora}:00`) : '00:00:00'
                    const horaCumplB = b.hora ? (b.hora.includes(':') ? b.hora : `${b.hora}:00`) : '00:00:00'
                    const [hCA, mCA] = horaCumplA.split(':').map(Number)
                    const [hCB, mCB] = horaCumplB.split(':').map(Number)
                    comparison = (hCA * 60 + mCA) - (hCB * 60 + mCB)
                    break

                case 'fecha_limite':
                    const fechaLimA = a.fecha_limite ? new Date(a.fecha_limite).getTime() : 0
                    const fechaLimB = b.fecha_limite ? new Date(b.fecha_limite).getTime() : 0
                    comparison = fechaLimA - fechaLimB
                    break

                case 'hora_limite':
                    const horaLimA = a.hora_limite ? (a.hora_limite.includes(':') ? a.hora_limite : `${a.hora_limite}:00`) : '00:00:00'
                    const horaLimB = b.hora_limite ? (b.hora_limite.includes(':') ? b.hora_limite : `${b.hora_limite}:00`) : '00:00:00'
                    const [hLA, mLA] = horaLimA.split(':').map(Number)
                    const [hLB, mLB] = horaLimB.split(':').map(Number)
                    comparison = (hLA * 60 + mLA) - (hLB * 60 + mLB)
                    break

                case 'usuario':
                    const usuarioA = a.usuario || ''
                    const usuarioB = b.usuario || ''
                    comparison = usuarioA.localeCompare(usuarioB, 'es', { sensitivity: 'base' })
                    break


                case 'departamento':
                    const depA = a.departamento || ''
                    const depB = b.departamento || ''
                    comparison = depA.localeCompare(depB, 'es', { sensitivity: 'base' })
                    break

                case 'proceso':
                    const procesoA = a.proceso || ''
                    const procesoB = b.proceso || ''
                    comparison = procesoA.localeCompare(procesoB, 'es', { sensitivity: 'base' })
                    break

                case 'hito':
                    const hitoA = a.hito || ''
                    const hitoB = b.hito || ''
                    comparison = hitoA.localeCompare(hitoB, 'es', { sensitivity: 'base' })
                    break

                case 'observacion':
                    const obsA = a.observacion || ''
                    const obsB = b.observacion || ''
                    comparison = obsA.localeCompare(obsB, 'es', { sensitivity: 'base' })
                    break

                case 'fecha_creacion':
                    const fechaCreA = a.fecha_creacion ? new Date(a.fecha_creacion).getTime() : 0
                    const fechaCreB = b.fecha_creacion ? new Date(b.fecha_creacion).getTime() : 0
                    comparison = fechaCreA - fechaCreB
                    break

                default:
                    return 0
            }

            return sortDirection === 'asc' ? comparison : -comparison
        })

        return sorted
    }


    // Filtrar cumplimientos usando useMemo para optimizar el rendimiento
    const cumplimientosFiltrados = useMemo(() => {
        const filtrados = cumplimientos.filter(cumplimiento => {
            const matchesSearch = !debouncedSearchTerm ||
                cumplimiento.proceso?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                cumplimiento.hito?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                cumplimiento.usuario?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                cumplimiento.observacion?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

            const matchesHito = !selectedHito || cumplimiento.hito_id?.toString() === selectedHito
            const matchesProceso = !selectedProceso || cumplimiento.proceso_id?.toString() === selectedProceso
            const matchesDepartamento = !selectedDepartamento || cumplimiento.departamento === selectedDepartamento

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

            return matchesSearch && matchesHito && matchesProceso && matchesFecha && matchesDepartamento
        })

        // Aplicar ordenamiento
        return sortCumplimientos(filtrados)
    }, [cumplimientos, debouncedSearchTerm, selectedHito, selectedProceso, selectedDepartamento, fechaDesde, fechaHasta, tipoFiltroFecha, sortField, sortDirection])

    return (
        <div
            style={{
                fontFamily: atisaStyles.fonts.secondary,
                backgroundColor: '#f8f9fa',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header Sticky con Título y Filtros */}
            <header
                style={{
                    background: 'linear-gradient(135deg, #00505c 0%, #007b8a 100%)',
                    color: 'white',
                    boxShadow: '0 4px 20px rgba(0, 80, 92, 0.15)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    width: '100%'
                }}
            >
                {/* Sección Título */}
                <div
                    style={{
                        padding: '24px 24px 16px 24px',
                        borderBottom: showFilters ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                    }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', width: '100%' }}>
                        {/* Columna izquierda: Botón Volver */}
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <button
                                className="btn"
                                onClick={() => navigate(`/clientes-documental-calendario`)}
                                style={getSecondaryButtonStyles()}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white'
                                    e.currentTarget.style.color = atisaStyles.colors.primary
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                    e.currentTarget.style.color = 'white'
                                }}
                            >
                                <i className="bi bi-arrow-left" style={{ color: 'inherit' }}></i>
                                Volver a Gestor Documental / Clientes
                            </button>
                        </div>

                        {/* Columna centro: Título */}
                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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
                                    fontFamily: atisaStyles.fonts.secondary,
                                    color: atisaStyles.colors.light,
                                    margin: '8px 0 0 0',
                                    fontSize: '1.2rem',
                                    fontWeight: '500'
                                }}
                            >
                                {cliente?.razsoc || clienteId}
                            </p>
                        </div>

                        {/* Columna derecha: Botón Ver Calendario y Toggle Filtros */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                className="btn"
                                onClick={() => setShowFilters(!showFilters)}
                                style={{
                                    backgroundColor: showFilters ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '8px',
                                    fontFamily: atisaStyles.fonts.secondary,
                                    fontWeight: '600',
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <i className={`bi ${showFilters ? 'bi-funnel-fill' : 'bi-funnel'}`}></i>
                                Filtros
                                <i className={`bi ${showFilters ? 'bi-chevron-up' : 'bi-chevron-down'} ms-1`}></i>
                            </button>

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
                </div>

                {/* Sección Filtros Collapsible */}
                {showFilters && (
                    <div
                        style={{
                            padding: '1.5rem 2rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        {/* Búsqueda Global */}
                        <div className="row g-3 mb-3">
                            <div className="col-12">
                                <div style={{ position: 'relative' }}>
                                    <i className="bi bi-search" style={{
                                        position: 'absolute',
                                        left: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'rgba(255, 255, 255, 0.7)'
                                    }}></i>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Buscar por nombre, proceso, hito o usuario..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            paddingLeft: '36px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            color: 'white',
                                            borderRadius: '6px'
                                        }}
                                    />
                                    {searching && (
                                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                                            <div className="spinner-border spinner-border-sm text-light" role="status"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="row g-3">
                            {/* Filtro Hito */}
                            <div className="col-md-3">
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Hito</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={selectedHito}
                                    onChange={(e) => setSelectedHito(e.target.value)}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        color: 'white',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <option value="" style={{ color: 'black' }}>Todos los hitos</option>
                                    {hitos.map((hito) => (
                                        <option key={hito.id} value={hito.id} style={{ color: 'black' }}>{hito.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro Proceso */}
                            <div className="col-md-3">
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Proceso</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={selectedProceso}
                                    onChange={(e) => setSelectedProceso(e.target.value)}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        color: 'white',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <option value="" style={{ color: 'black' }}>Todos los procesos</option>
                                    {procesos.map((proceso) => (
                                        <option key={proceso.id} value={proceso.id} style={{ color: 'black' }}>{proceso.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro Departamento */}
                            <div className="col-md-3">
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Departamento</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={selectedDepartamento}
                                    onChange={(e) => setSelectedDepartamento(e.target.value)}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        color: 'white',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <option value="" style={{ color: 'black' }}>Todos los departamentos</option>
                                    {subdepartamentos.map((subdep) => (
                                        <option key={subdep.id} value={subdep.nombre || ''} style={{ color: 'black' }}>{subdep.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro Tipo Fecha */}
                            <div className="col-md-2">
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Tipo Fecha</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={tipoFiltroFecha}
                                    onChange={(e) => setTipoFiltroFecha(e.target.value as any)}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        color: 'white',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <option value="cumplimiento" style={{ color: 'black' }}>Cumplimiento</option>
                                    <option value="creacion" style={{ color: 'black' }}>Creación</option>
                                    <option value="limite" style={{ color: 'black' }}>Límite</option>
                                </select>
                            </div>

                            {/* Fecha Desde */}
                            <div className="col-md-2">
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Desde</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={fechaDesde}
                                    onChange={(e) => setFechaDesde(e.target.value)}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        color: 'white',
                                        borderRadius: '6px'
                                    }}
                                />
                            </div>

                            {/* Fecha Hasta */}
                            <div className="col-md-2">
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Hasta</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={fechaHasta}
                                    onChange={(e) => setFechaHasta(e.target.value)}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        color: 'white',
                                        borderRadius: '6px'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="row mt-3">
                            <div className="col-12 d-flex justify-content-end">
                                <button
                                    className="btn btn-sm"
                                    onClick={limpiarFiltros}
                                    style={{
                                        color: 'white',
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                    }}
                                >
                                    <i className="bi bi-arrow-clockwise me-1"></i> Limpiar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <div className="p-4 flex-grow-1">

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
                                        className="cursor-pointer user-select-none"
                                        onClick={() => handleSort('fecha_cumplimiento')}
                                        style={{
                                            fontFamily: atisaStyles.fonts.primary,
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            padding: '16px 12px',
                                            border: 'none',
                                            color: 'white',
                                            backgroundColor: atisaStyles.colors.primary,
                                            transition: 'background-color 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                        }}
                                    >
                                        Fecha Cumplimiento {getSortIcon('fecha_cumplimiento')}
                                    </th>
                                    <th
                                        className="cursor-pointer user-select-none"
                                        onClick={() => handleSort('hora_cumplimiento')}
                                        style={{
                                            fontFamily: atisaStyles.fonts.primary,
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            padding: '16px 12px',
                                            border: 'none',
                                            color: 'white',
                                            backgroundColor: atisaStyles.colors.primary,
                                            transition: 'background-color 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                        }}
                                    >
                                        Hora Cumplimiento {getSortIcon('hora_cumplimiento')}
                                    </th>
                                    <th
                                        className="cursor-pointer user-select-none"
                                        onClick={() => handleSort('fecha_limite')}
                                        style={{
                                            fontFamily: atisaStyles.fonts.primary,
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            padding: '16px 12px',
                                            border: 'none',
                                            color: 'white',
                                            backgroundColor: atisaStyles.colors.primary,
                                            transition: 'background-color 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                        }}
                                    >
                                        Fecha Límite Hito {getSortIcon('fecha_limite')}
                                    </th>
                                    <th
                                        className="cursor-pointer user-select-none"
                                        onClick={() => handleSort('hora_limite')}
                                        style={{
                                            fontFamily: atisaStyles.fonts.primary,
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            padding: '16px 12px',
                                            border: 'none',
                                            color: 'white',
                                            backgroundColor: atisaStyles.colors.primary,
                                            transition: 'background-color 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                        }}
                                    >
                                        Hora Límite Hito {getSortIcon('hora_limite')}
                                    </th>
                                    <th
                                        className="cursor-pointer user-select-none"
                                        onClick={() => handleSort('usuario')}
                                        style={{
                                            fontFamily: atisaStyles.fonts.primary,
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            padding: '16px 12px',
                                            border: 'none',
                                            color: 'white',
                                            backgroundColor: atisaStyles.colors.primary,
                                            transition: 'background-color 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                        }}
                                    >
                                        Usuario {getSortIcon('usuario')}
                                    </th>

                                    <th
                                        className="cursor-pointer user-select-none"
                                        onClick={() => handleSort('departamento')}
                                        style={{
                                            fontFamily: atisaStyles.fonts.primary,
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            padding: '16px 12px',
                                            border: 'none',
                                            color: 'white',
                                            backgroundColor: atisaStyles.colors.primary,
                                            transition: 'background-color 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                        }}
                                    >
                                        Departamento {getSortIcon('departamento')}
                                    </th>
                                    <th
                                        className="cursor-pointer user-select-none"
                                        onClick={() => handleSort('proceso')}
                                        style={{
                                            fontFamily: atisaStyles.fonts.primary,
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            padding: '16px 12px',
                                            border: 'none',
                                            color: 'white',
                                            backgroundColor: atisaStyles.colors.primary,
                                            transition: 'background-color 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                        }}
                                    >
                                        Proceso {getSortIcon('proceso')}
                                    </th>
                                    <th
                                        className="cursor-pointer user-select-none"
                                        onClick={() => handleSort('hito')}
                                        style={{
                                            fontFamily: atisaStyles.fonts.primary,
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            padding: '16px 12px',
                                            border: 'none',
                                            color: 'white',
                                            backgroundColor: atisaStyles.colors.primary,
                                            transition: 'background-color 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                        }}
                                    >
                                        Hito {getSortIcon('hito')}
                                    </th>
                                    <th
                                        className="cursor-pointer user-select-none"
                                        onClick={() => handleSort('observacion')}
                                        style={{
                                            fontFamily: atisaStyles.fonts.primary,
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            padding: '16px 12px',
                                            border: 'none',
                                            color: 'white',
                                            backgroundColor: atisaStyles.colors.primary,
                                            transition: 'background-color 0.2s ease',
                                            cursor: 'pointer',
                                            textAlign: 'center'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                        }}
                                    >
                                        Observación {getSortIcon('observacion')}
                                    </th>
                                    <th
                                        className="cursor-pointer user-select-none"
                                        onClick={() => handleSort('fecha_creacion')}
                                        style={{
                                            fontFamily: atisaStyles.fonts.primary,
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            padding: '16px 12px',
                                            border: 'none',
                                            color: 'white',
                                            backgroundColor: atisaStyles.colors.primary,
                                            transition: 'background-color 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                        }}
                                    >
                                        Fecha / Hora Creación {getSortIcon('fecha_creacion')}
                                    </th>
                                    <th
                                        style={{
                                            fontFamily: atisaStyles.fonts.primary,
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            padding: '16px 12px',
                                            border: 'none',
                                            color: 'white',
                                            backgroundColor: atisaStyles.colors.primary,
                                            textAlign: 'center'
                                        }}
                                    >
                                        Documentos
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={10}
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
                                            colSpan={10}
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
                                                    padding: '16px 12px',
                                                    verticalAlign: 'middle'
                                                }}
                                            >
                                                {formatDate(cumplimiento.fecha)}
                                            </td>
                                            <td
                                                style={{
                                                    fontFamily: atisaStyles.fonts.secondary,
                                                    color: atisaStyles.colors.dark,
                                                    padding: '16px 12px',
                                                    verticalAlign: 'middle'
                                                }}
                                            >
                                                {formatTime(cumplimiento.hora)}
                                            </td>
                                            <td
                                                style={{
                                                    fontFamily: atisaStyles.fonts.secondary,
                                                    color: atisaStyles.colors.primary,
                                                    fontWeight: '600',
                                                    padding: '16px 12px',
                                                    verticalAlign: 'middle'
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
                                                    padding: '16px 12px',
                                                    verticalAlign: 'middle'
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
                                                    padding: '16px 12px',
                                                    verticalAlign: 'middle'
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
                                                    padding: '16px 12px',
                                                    verticalAlign: 'middle'
                                                }}
                                            >
                                                {cumplimiento.departamento || '-'}
                                            </td>
                                            <td
                                                style={{
                                                    fontFamily: atisaStyles.fonts.secondary,
                                                    color: atisaStyles.colors.dark,
                                                    padding: '16px 12px',
                                                    verticalAlign: 'middle'
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
                                                    padding: '16px 12px',
                                                    verticalAlign: 'middle'
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
                                                    padding: '16px 12px',
                                                    verticalAlign: 'middle',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                {cumplimiento.observacion ? (
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={
                                                            <Tooltip id={`tooltip-obs-${cumplimiento.id}`} style={{ maxWidth: '300px' }}>
                                                                {cumplimiento.observacion}
                                                            </Tooltip>
                                                        }
                                                    >
                                                        <button
                                                            type="button"
                                                            className="btn btn-icon btn-sm"
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                padding: 0,
                                                                transition: 'transform 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                        >
                                                            <i
                                                                className="bi bi-chat-square-text-fill"
                                                                style={{
                                                                    color: '#dc3545', // Color rojo similar a indicador de comentario Excel
                                                                    fontSize: '20px'
                                                                }}
                                                            ></i>
                                                        </button>
                                                    </OverlayTrigger>
                                                ) : (
                                                    <i
                                                        className="bi bi-chat-square"
                                                        style={{
                                                            color: '#dee2e6',
                                                            fontSize: '20px'
                                                        }}
                                                    ></i>
                                                )}
                                            </td>
                                            <td
                                                style={{
                                                    fontFamily: atisaStyles.fonts.secondary,
                                                    color: atisaStyles.colors.primary,
                                                    fontWeight: '600',
                                                    padding: '16px 12px',
                                                    verticalAlign: 'middle'
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
                                            <td
                                                style={{
                                                    fontFamily: atisaStyles.fonts.secondary,
                                                    padding: '16px 12px',
                                                    textAlign: 'center',
                                                    verticalAlign: 'middle'
                                                }}
                                            >
                                                {cumplimiento.id && cumplimiento.num_documentos && cumplimiento.num_documentos > 0 ? (
                                                    <button
                                                        className="btn btn-sm"
                                                        onClick={() => handleDescargarDocumentos(cumplimiento.id!)}
                                                        disabled={downloadingCumplimientoId === cumplimiento.id}
                                                        style={{
                                                            backgroundColor: atisaStyles.colors.accent,
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            padding: '0',
                                                            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: '38px',
                                                            height: '38px',
                                                            boxShadow: '0 2px 8px rgba(0, 161, 222, 0.25)',
                                                            cursor: downloadingCumplimientoId === cumplimiento.id ? 'not-allowed' : 'pointer',
                                                            lineHeight: '1',
                                                            verticalAlign: 'middle'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!e.currentTarget.disabled) {
                                                                e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 80, 92, 0.35)'
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!e.currentTarget.disabled) {
                                                                e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 161, 222, 0.25)'
                                                            }
                                                        }}
                                                        title={`Descargar ${cumplimiento.num_documentos} documento(s)`}
                                                    >
                                                        {downloadingCumplimientoId === cumplimiento.id ? (
                                                            <span
                                                                className="spinner-border spinner-border-sm"
                                                                style={{
                                                                    width: '20px',
                                                                    height: '20px',
                                                                    borderWidth: '3px',
                                                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                                                    borderTopColor: 'white'
                                                                }}
                                                            ></span>
                                                        ) : (
                                                            <i className="bi bi-download" style={{ fontSize: '20px', lineHeight: '1', fontWeight: 'bold', color: 'white' }}></i>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <i
                                                        className="bi bi-file-earmark-x"
                                                        title="Sin documentos"
                                                        style={{
                                                            color: '#dee2e6',
                                                            fontSize: '20px'
                                                        }}
                                                    ></i>
                                                )}
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
        </div>
    )
}

export default HistoricoCumplimientos
