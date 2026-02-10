import { FC, useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { atisaStyles, getSecondaryButtonStyles } from '../../../../styles/atisaStyles'
import SharedPagination from '../../../../components/pagination/SharedPagination'
import { Cliente, getClienteById } from '../../../../api/clientes'
import { getClienteProcesosByCliente } from '../../../../api/clienteProcesos'
import { getClienteProcesoHitosHabilitadosByProceso, ClienteProcesoHito } from '../../../../api/clienteProcesoHitos'
import { getAllHitos } from '../../../../api/hitos'
import { getAllProcesos } from '../../../../api/procesos'
import { getClienteProcesoHitoCumplimientosByHito, ClienteProcesoHitoCumplimiento } from '../../../../api/clienteProcesoHitoCumplimientos'
import api from '../../../../api/axiosConfig'

// Extendemos la interfaz para incluir los campos adicionales
interface HitoConInfo extends ClienteProcesoHito {
    proceso_nombre?: string
    hito_nombre?: string
}

interface Props {
    clienteId: string
}

const StatusCliente: FC<Props> = ({ clienteId }) => {
    const navigate = useNavigate()
    const [cliente, setCliente] = useState<Cliente | null>(null)
    const [hitos, setHitos] = useState<HitoConInfo[]>([])
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [total, setTotal] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [searching, setSearching] = useState(false)
    const [selectedHito, setSelectedHito] = useState('')
    const [selectedProceso, setSelectedProceso] = useState('')
    const [selectedEstados, setSelectedEstados] = useState<Set<'cumplido_en_plazo' | 'cumplido_fuera_plazo' | 'vence_hoy' | 'pendiente_fuera_plazo' | 'pendiente_en_plazo'>>(new Set())
    const [selectedTipos, setSelectedTipos] = useState<Set<string>>(new Set())
    // Obtener fecha de hoy en formato YYYY-MM-DD para el input type="date"
    const getTodayDate = () => {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }
    const [fechaDesde, setFechaDesde] = useState(getTodayDate())
    const [fechaHasta, setFechaHasta] = useState('')
    const [hitosMaestro, setHitosMaestro] = useState<any[]>([])
    const [procesosList, setProcesosList] = useState<any[]>([])
    const [showFilters, setShowFilters] = useState(false)
    const [sortField, setSortField] = useState<'proceso' | 'hito' | 'estado' | 'fecha_limite' | 'hora_limite' | 'fecha_estado' | 'tipo'>('fecha_limite')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [cumplimientosPorHito, setCumplimientosPorHito] = useState<Record<number, ClienteProcesoHitoCumplimiento[]>>({})

    // Función para normalizar texto
    const normalizeText = (text: string | null | undefined): string => {
        if (!text) return ''
        return String(text)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
    }

    // Función para cargar todos los hitos del cliente
    const cargarHitos = async () => {
        setLoading(true)
        try {
            // Obtener todos los procesos del cliente
            const procesos = await getClienteProcesosByCliente(clienteId)

            // Obtener todos los hitos habilitados de todos los procesos
            const hitosPromises = procesos.clienteProcesos?.map(async (proceso) => {
                try {
                    const hitosData = await getClienteProcesoHitosHabilitadosByProceso(proceso.id)
                    const procesoNombre = procesosList.find(p => p.id === proceso.proceso_id)?.nombre || 'Sin nombre'
                    return hitosData.map(hito => ({
                        ...hito,
                        proceso_nombre: procesoNombre,
                        hito_nombre: hitosMaestro.find(h => h.id === hito.hito_id)?.nombre || 'Sin nombre'
                    }))
                } catch (error) {
                    console.warn(`Error cargando hitos para proceso ${proceso.id}:`, error)
                    return []
                }
            }) || []

            const todosLosHitos = (await Promise.all(hitosPromises)).flat()
            setHitos(todosLosHitos)
            setTotal(todosLosHitos.length)

            // Cargar cumplimientos de forma asíncrona
            if (todosLosHitos.length > 0) {
                const cumplimientosPromises = todosLosHitos.map(hito =>
                    getClienteProcesoHitoCumplimientosByHito(hito.id, 0, 1, 'id', 'desc')
                        .then(cumplimientos => ({ hitoId: hito.id, cumplimientos: cumplimientos || [] }))
                        .catch((error) => {
                            console.warn(`Error cargando cumplimientos para hito ${hito.id}:`, error)
                            return { hitoId: hito.id, cumplimientos: [] }
                        })
                )

                const resultadosCumplimientos = await Promise.all(cumplimientosPromises)
                const cumplimientosMap: Record<number, ClienteProcesoHitoCumplimiento[]> = {}
                resultadosCumplimientos.forEach(({ hitoId, cumplimientos }) => {
                    cumplimientosMap[hitoId] = cumplimientos || []
                })
                setCumplimientosPorHito(cumplimientosMap)
            } else {
                setCumplimientosPorHito({})
            }
        } catch (error) {
            console.error('Error cargando hitos:', error)
            setHitos([])
            setTotal(0)
            setCumplimientosPorHito({})
        } finally {
            setLoading(false)
        }
    }

    // Cargar hitos maestro y procesos
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [hitosRes, procesosRes] = await Promise.all([
                    getAllHitos(),
                    getAllProcesos()
                ])
                setHitosMaestro(hitosRes.hitos || [])
                setProcesosList(procesosRes.procesos || [])
            } catch (error) {
                console.error('Error cargando datos:', error)
            }
        }
        cargarDatos()
    }, [])

    // Debounce para el término de búsqueda
    useEffect(() => {
        if (searchTerm) {
            setSearching(true)
        }

        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
            setSearching(false)
        }, 300)

        return () => {
            clearTimeout(timer)
            setSearching(false)
        }
    }, [searchTerm])

    // Cargar datos iniciales
    useEffect(() => {
        if (clienteId) {
            getClienteById(clienteId).then(setCliente)
            if (hitosMaestro.length > 0 && procesosList.length > 0) {
                cargarHitos()
            }
        }
    }, [clienteId, hitosMaestro.length, procesosList.length])

    const formatDate = (date: string) => {
        if (!date) return '-'
        const d = new Date(date)
        return d.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const formatTime = (time: string | null) => {
        if (!time) return '-'
        if (time.match(/^\d{2}:\d{2}$/)) {
            return time
        }
        if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
            return time.substring(0, 5)
        }
        return time
    }

    // Determinar estado temporal del hito respecto a hoy (UTC)
    const getEstadoVencimiento = (fechaLimite?: string | null, estado?: string) => {
        if (!fechaLimite) return 'sin_fecha'
        if (estado === 'Finalizado') return 'finalizado'
        try {
            const hoy = new Date()
            const hoyUTC = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()))
            const [y, m, d] = fechaLimite.split('-').map(Number)
            const fecha = new Date(Date.UTC(y, m - 1, d))
            if (fecha.getTime() < hoyUTC.getTime()) return 'vencido'
            if (fecha.getTime() === hoyUTC.getTime()) return 'hoy'
            return 'en_plazo'
        } catch {
            return 'en_plazo'
        }
    }

    // Determinar si un hito vence mañana
    const venceMañana = (fechaLimite?: string | null) => {
        if (!fechaLimite) return false
        try {
            const hoy = new Date()
            const mañanaUTC = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() + 1))
            const [y, m, d] = fechaLimite.split('-').map(Number)
            const fecha = new Date(Date.UTC(y, m - 1, d))
            return fecha.getTime() === mañanaUTC.getTime()
        } catch {
            return false
        }
    }

    // Obtener fecha del último cumplimiento
    const getUltimoCumplimientoDate = (hitoId: number): Date | null => {
        const lista = cumplimientosPorHito[hitoId]
        if (!lista || lista.length === 0) return null
        const c = lista[0]
        if (!c.fecha) return null
        const horaStr = c.hora ? (c.hora.includes(':') ? c.hora : `${c.hora}:00`) : '00:00'
        const dt = new Date(`${c.fecha}T${horaStr.length === 5 ? horaStr + ':00' : horaStr}`)
        return isNaN(dt.getTime()) ? null : dt
    }

    // Obtener fecha límite con hora
    const getFechaLimiteDate = (fechaLimite?: string | null, horaLimite?: string | null): Date | null => {
        if (!fechaLimite) return null
        const horaStr = horaLimite && !horaLimite.startsWith('00:00')
            ? (horaLimite.includes(':') ? horaLimite : `${horaLimite}:00`)
            : '23:59:59'
        const dt = new Date(`${fechaLimite}T${horaStr.length === 5 ? horaStr + ':00' : horaStr}`)
        return isNaN(dt.getTime()) ? null : dt
    }

    // Determinar si fue finalizado fuera de plazo
    const isFinalizadoFueraDePlazo = (h: ClienteProcesoHito): boolean => {
        if (h.estado !== 'Finalizado') return false
        const ult = getUltimoCumplimientoDate(h.id)
        const limite = getFechaLimiteDate(h.fecha_limite, h.hora_limite)
        if (!ult || !limite) return false
        return ult.getTime() > limite.getTime()
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    // Función para limpiar filtros
    const limpiarFiltros = () => {
        setSearchTerm('')
        setSelectedHito('')
        setSelectedProceso('')
        setSelectedEstados(new Set())
        setSelectedTipos(new Set())
        setFechaDesde(getTodayDate())
        setFechaHasta('')
        setCurrentPage(1)
    }

    // Función para exportar a Excel
    const exportarExcel = async () => {
        setExporting(true)
        try {
            // Construir parámetros de query
            const params = new URLSearchParams()

            if (selectedHito) {
                params.append('hito_id', selectedHito)
            }

            if (selectedProceso) {
                params.append('proceso_nombre', selectedProceso)
            }

            if (fechaDesde) {
                params.append('fecha_desde', fechaDesde)
            }

            if (fechaHasta) {
                params.append('fecha_hasta', fechaHasta)
            }

            if (selectedEstados.size > 0) {
                params.append('estados', Array.from(selectedEstados).join(','))
            }

            if (selectedTipos.size > 0) {
                params.append('tipos', Array.from(selectedTipos).join(','))
            }

            if (debouncedSearchTerm) {
                params.append('search_term', debouncedSearchTerm)
            }

            // Construir URL completa
            const url = `/status-cliente/${clienteId}/exportar-excel${params.toString() ? `?${params.toString()}` : ''}`

            // Hacer la petición para descargar el archivo
            const response = await api.get(url, {
                responseType: 'blob'
            })

            // Crear un blob con el archivo
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })

            // Crear un enlace temporal para descargar
            const urlBlob = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = urlBlob

            // Obtener el nombre del archivo del header Content-Disposition o usar uno por defecto
            const contentDisposition = response.headers['content-disposition']
            let filename = `status_hitos_cliente_${clienteId}_${getTodayDate()}.xlsx`
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1]
                }
            }

            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()

            // Limpiar
            link.remove()
            window.URL.revokeObjectURL(urlBlob)
        } catch (error) {
            console.error('Error al exportar Excel:', error)
            alert('Error al exportar el archivo Excel. Por favor, intente nuevamente.')
        } finally {
            setExporting(false)
        }
    }

    // Función para toggle de estados
    const toggleEstado = (estado: 'cumplido_en_plazo' | 'cumplido_fuera_plazo' | 'vence_hoy' | 'pendiente_fuera_plazo' | 'pendiente_en_plazo') => {
        const nuevosEstados = new Set(selectedEstados)
        if (nuevosEstados.has(estado)) {
            nuevosEstados.delete(estado)
        } else {
            nuevosEstados.add(estado)
        }
        setSelectedEstados(nuevosEstados)
    }

    // Función para toggle de tipos
    const toggleTipo = (tipo: string) => {
        const nuevosTipos = new Set(selectedTipos)
        if (nuevosTipos.has(tipo)) {
            nuevosTipos.delete(tipo)
        } else {
            nuevosTipos.add(tipo)
        }
        setSelectedTipos(nuevosTipos)
    }

    // Función para manejar el ordenamiento
    const handleSort = (field: 'proceso' | 'hito' | 'estado' | 'fecha_limite' | 'hora_limite' | 'fecha_estado' | 'tipo') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Función para obtener el icono de ordenamiento
    const getSortIcon = (field: 'proceso' | 'hito' | 'estado' | 'fecha_limite' | 'hora_limite' | 'fecha_estado' | 'tipo') => {
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

    // Función para ordenar los hitos
    const sortHitos = (hitos: HitoConInfo[]): HitoConInfo[] => {
        const sorted = [...hitos].sort((a, b) => {
            let comparison = 0

            switch (sortField) {
                case 'proceso':
                    const procesoA = a.proceso_nombre || ''
                    const procesoB = b.proceso_nombre || ''
                    comparison = procesoA.localeCompare(procesoB, 'es', { sensitivity: 'base' })
                    break

                case 'hito':
                    const hitoA = a.hito_nombre || ''
                    const hitoB = b.hito_nombre || ''
                    comparison = hitoA.localeCompare(hitoB, 'es', { sensitivity: 'base' })
                    break

                case 'estado':
                    const estadoA = a.estado || ''
                    const estadoB = b.estado || ''
                    comparison = estadoA.localeCompare(estadoB, 'es', { sensitivity: 'base' })
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

                case 'fecha_estado':
                    const fechaEstA = a.fecha_estado ? new Date(a.fecha_estado).getTime() : 0
                    const fechaEstB = b.fecha_estado ? new Date(b.fecha_estado).getTime() : 0
                    comparison = fechaEstA - fechaEstB
                    break

                case 'tipo':
                    const tipoA = a.tipo || ''
                    const tipoB = b.tipo || ''
                    comparison = tipoA.localeCompare(tipoB, 'es', { sensitivity: 'base' })
                    break

                default:
                    return 0
            }

            return sortDirection === 'asc' ? comparison : -comparison
        })

        return sorted
    }

    // Filtrar hitos usando useMemo
    const hitosFiltrados = useMemo(() => {
        const filtrados = hitos.filter(hito => {
            const searchNormalized = normalizeText(debouncedSearchTerm)
            const matchesSearch = !debouncedSearchTerm ||
                normalizeText(hito.proceso_nombre).includes(searchNormalized) ||
                normalizeText(hito.hito_nombre).includes(searchNormalized)

            const matchesHito = !selectedHito || hito.hito_id?.toString() === selectedHito
            const matchesProceso = !selectedProceso || hito.proceso_nombre === selectedProceso

            // Filtro de estado basado en la lógica de estados (múltiple selección)
            let matchesEstado = true
            if (selectedEstados.size > 0) {
                const isFinalized = hito.estado === 'Finalizado'
                const isNuevo = hito.estado === 'Nuevo'
                const estadoVenc = getEstadoVencimiento(hito.fecha_limite, hito.estado)
                const finalizadoFuera = isFinalizadoFueraDePlazo(hito)
                const venceHoy = isNuevo && estadoVenc === 'hoy'

                // Verificar si el hito coincide con alguno de los estados seleccionados
                matchesEstado = Array.from(selectedEstados).some(estado => {
                    switch (estado) {
                        case 'cumplido_en_plazo':
                            return isFinalized && !finalizadoFuera
                        case 'cumplido_fuera_plazo':
                            return isFinalized && finalizadoFuera
                        case 'vence_hoy':
                            return venceHoy
                        case 'pendiente_fuera_plazo':
                            return !isFinalized && estadoVenc === 'vencido'
                        case 'pendiente_en_plazo':
                            return !isFinalized && estadoVenc === 'en_plazo'
                        default:
                            return false
                    }
                })
            }

            // Filtro de tipo (múltiple selección)
            let matchesTipo = true
            if (selectedTipos.size > 0) {
                matchesTipo = hito.tipo ? selectedTipos.has(hito.tipo) : false
            }

            let matchesFecha = true
            if (fechaDesde || fechaHasta) {
                const fechaLimite = hito.fecha_limite ? new Date(hito.fecha_limite) : null
                if (fechaLimite && !isNaN(fechaLimite.getTime())) {
                    if (fechaDesde) {
                        const fechaDesdeDate = new Date(fechaDesde)
                        matchesFecha = matchesFecha && fechaLimite >= fechaDesdeDate
                    }
                    if (fechaHasta) {
                        const fechaHastaDate = new Date(fechaHasta)
                        matchesFecha = matchesFecha && fechaLimite <= fechaHastaDate
                    }
                } else {
                    matchesFecha = false
                }
            }

            return matchesSearch && matchesHito && matchesProceso && matchesEstado && matchesTipo && matchesFecha
        })

        return sortHitos(filtrados)
    }, [hitos, debouncedSearchTerm, selectedHito, selectedProceso, selectedEstados, selectedTipos, fechaDesde, fechaHasta, sortField, sortDirection, cumplimientosPorHito])

    // Paginación
    const paginatedHitos = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return hitosFiltrados.slice(startIndex, endIndex)
    }, [hitosFiltrados, currentPage, itemsPerPage])

    // Obtener procesos únicos para el filtro
    const procesosUnicos = useMemo(() => {
        const procesosSet = new Set<string>()
        hitos.forEach(hito => {
            if (hito.proceso_nombre) {
                procesosSet.add(hito.proceso_nombre)
            }
        })
        return Array.from(procesosSet).sort()
    }, [hitos])

    // Obtener tipos únicos para el filtro
    const tiposUnicos = useMemo(() => {
        const tiposSet = new Set<string>()
        hitos.forEach(hito => {
            if (hito.tipo) {
                tiposSet.add(hito.tipo)
            }
        })
        return Array.from(tiposSet).sort()
    }, [hitos])

    // Obtener hitos únicos del cliente para el filtro
    const hitosUnicosDelCliente = useMemo(() => {
        const hitosSet = new Map<number, { id: number, nombre: string }>()
        hitos.forEach(hito => {
            if (hito.hito_id && hito.hito_nombre) {
                hitosSet.set(hito.hito_id, {
                    id: hito.hito_id,
                    nombre: hito.hito_nombre
                })
            }
        })
        return Array.from(hitosSet.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
    }, [hitos])

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
                                <i className="bi bi-info-circle" style={{ color: 'white' }}></i>
                                Status de Hitos
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
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            maxHeight: 'calc(100vh - 150px)',
                            overflowY: 'auto'
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
                                        placeholder="Buscar por proceso, hito..."
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
                                    {hitosUnicosDelCliente.map((hito) => (
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
                                    {procesosUnicos.map((proceso, index) => (
                                        <option key={index} value={proceso} style={{ color: 'black' }}>{proceso}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Fecha Desde */}
                            <div className="col-md-3">
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Fecha Vencimiento Desde</label>
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
                            <div className="col-md-3">
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Fecha Vencimiento Hasta</label>
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

                        {/* Filtros de Estado y Tipo */}
                        <div className="row mt-3">
                            <div className="col-md-6">
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Estado del Hito</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {/* Botón Todos */}
                                    <div
                                        onClick={() => setSelectedEstados(new Set())}
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: selectedEstados.size === 0 ? 'white' : 'rgba(255, 255, 255, 0.1)',
                                            color: selectedEstados.size === 0 ? atisaStyles.colors.primary : 'white',
                                            border: '1px solid white',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        Todos
                                    </div>

                                    {[
                                        { id: 'cumplido_en_plazo', label: 'Cumplido en Plazo', color: '#50cd89' },
                                        { id: 'cumplido_fuera_plazo', label: 'Cumplido Fuera de Plazo', color: '#ffc107' },
                                        { id: 'vence_hoy', label: 'Vence Hoy', color: '#009ef7' },
                                        { id: 'pendiente_en_plazo', label: 'Pendiente en Plazo', color: '#7239ea' },
                                        { id: 'pendiente_fuera_plazo', label: 'Pendiente Fuera de Plazo', color: '#f1416c' }
                                    ].map((estado) => {
                                        const isSelected = selectedEstados.has(estado.id as any)
                                        return (
                                            <div
                                                key={estado.id}
                                                onClick={() => toggleEstado(estado.id as any)}
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: isSelected ? estado.color : 'rgba(255, 255, 255, 0.1)',
                                                    color: 'white',
                                                    border: `1px solid ${estado.color}`,
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    opacity: isSelected ? 1 : 0.6,
                                                    transition: 'all 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {estado.label}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Tipo</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {['Atisa', 'Cliente', 'Terceros'].map((tipo) => (
                                        <div key={tipo} className="form-check me-3">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`check-tipo-${tipo}`}
                                                checked={selectedTipos.has(tipo)}
                                                onChange={() => toggleTipo(tipo)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <label className="form-check-label" htmlFor={`check-tipo-${tipo}`} style={{ color: 'white', fontSize: '13px', cursor: 'pointer' }}>
                                                {tipo}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="row mt-3">
                            <div className="col-12 d-flex justify-content-end gap-2">
                                <button
                                    className="btn btn-sm"
                                    onClick={exportarExcel}
                                    disabled={exporting}
                                    style={{
                                        color: 'white',
                                        backgroundColor: '#50cd89',
                                        borderColor: '#50cd89',
                                        opacity: exporting ? 0.7 : 1
                                    }}
                                >
                                    {exporting ? (
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    ) : (
                                        <i className="bi bi-file-earmark-excel me-1"></i>
                                    )}
                                    Exportar a Excel
                                </button>

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
            </header >

            <div className="p-4 flex-grow-1">
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
                            Listado de Hitos ({hitosFiltrados.length})
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
                                    >
                                        Hito {getSortIcon('hito')}
                                    </th>
                                    <th
                                        className="cursor-pointer user-select-none"
                                        onClick={() => handleSort('estado')}
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
                                    >
                                        Estado {getSortIcon('estado')}
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
                                    >
                                        Fecha Límite {getSortIcon('fecha_limite')}
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
                                    >
                                        Hora Límite {getSortIcon('hora_limite')}
                                    </th>
                                    <th
                                        className="cursor-pointer user-select-none"
                                        onClick={() => handleSort('fecha_estado')}
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
                                    >
                                        Fecha Estado {getSortIcon('fecha_estado')}
                                    </th>
                                    <th
                                        className="cursor-pointer user-select-none"
                                        onClick={() => handleSort('tipo')}
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
                                    >
                                        Tipo {getSortIcon('tipo')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
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
                                                <span className="visually-hidden">Cargando hitos...</span>
                                            </div>
                                            <span
                                                className="ms-2"
                                                style={{
                                                    color: atisaStyles.colors.dark,
                                                    fontFamily: atisaStyles.fonts.secondary,
                                                    fontWeight: '500'
                                                }}
                                            >
                                                Cargando hitos...
                                            </span>
                                        </td>
                                    </tr>
                                ) : hitosFiltrados.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center py-4"
                                            style={{
                                                backgroundColor: '#f8f9fa',
                                                fontFamily: atisaStyles.fonts.secondary,
                                                padding: '2rem',
                                                color: atisaStyles.colors.dark
                                            }}
                                        >
                                            <i className="bi bi-info-circle me-2" style={{ color: atisaStyles.colors.dark }}></i>
                                            {debouncedSearchTerm || selectedHito || selectedProceso || selectedEstados.size > 0 || selectedTipos.size > 0 || fechaDesde || fechaHasta
                                                ? 'No se encontraron hitos con los filtros aplicados'
                                                : 'No hay hitos registrados para este cliente'
                                            }
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedHitos.map((hito, index) => (
                                        <tr
                                            key={hito.id}
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
                                                    color: atisaStyles.colors.dark,
                                                    padding: '16px 12px',
                                                    verticalAlign: 'middle'
                                                }}
                                            >
                                                <span title={hito.proceso_nombre || 'No disponible'}>
                                                    {hito.proceso_nombre || 'No disponible'}
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
                                                <span title={hito.hito_nombre || 'No disponible'}>
                                                    {hito.hito_nombre || 'No disponible'}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    fontFamily: atisaStyles.fonts.secondary,
                                                    padding: '16px 12px',
                                                    verticalAlign: 'middle'
                                                }}
                                            >
                                                {(() => {
                                                    const isFinalized = hito.estado === 'Finalizado'
                                                    const isNuevo = hito.estado === 'Nuevo'
                                                    const estadoVenc = getEstadoVencimiento(hito.fecha_limite, hito.estado)
                                                    const finalizadoFuera = isFinalizadoFueraDePlazo(hito)
                                                    const venceHoy = isNuevo && estadoVenc === 'hoy'

                                                    if (isFinalized) {
                                                        return finalizadoFuera ? (
                                                            <span style={{ backgroundColor: '#b45309', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                                                Cumplido fuera de plazo
                                                            </span>
                                                        ) : (
                                                            <span style={{ backgroundColor: '#16a34a', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                                                Cumplido en plazo
                                                            </span>
                                                        )
                                                    } else if (venceHoy) {
                                                        return (
                                                            <span style={{ backgroundColor: '#dc2626', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                                                Vence hoy
                                                            </span>
                                                        )
                                                    } else if (estadoVenc === 'vencido') {
                                                        return (
                                                            <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                                                Pendiente fuera de plazo
                                                            </span>
                                                        )
                                                    } else {
                                                        return (
                                                            <span style={{ backgroundColor: atisaStyles.colors.accent, color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                                                Pendiente en plazo
                                                            </span>
                                                        )
                                                    }
                                                })()}
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
                                                {hito.fecha_limite ? formatDate(hito.fecha_limite) : '-'}
                                            </td>
                                            <td
                                                style={{
                                                    fontFamily: atisaStyles.fonts.secondary,
                                                    color: atisaStyles.colors.dark,
                                                    padding: '16px 12px',
                                                    verticalAlign: 'middle'
                                                }}
                                            >
                                                {formatTime(hito.hora_limite)}
                                            </td>
                                            <td
                                                style={{
                                                    fontFamily: atisaStyles.fonts.secondary,
                                                    color: atisaStyles.colors.dark,
                                                    padding: '16px 12px',
                                                    verticalAlign: 'middle'
                                                }}
                                            >
                                                {hito.fecha_estado ? formatDate(hito.fecha_estado) : '-'}
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
                                                    {hito.tipo || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {
                        hitosFiltrados.length > itemsPerPage && (
                            <div
                                style={{
                                    padding: '1.5rem',
                                    borderTop: `1px solid ${atisaStyles.colors.light}`,
                                    backgroundColor: '#f8f9fa'
                                }}
                            >
                                <SharedPagination
                                    currentPage={currentPage}
                                    totalItems={hitosFiltrados.length}
                                    pageSize={itemsPerPage}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )
                    }
                </div>
            </div>
        </div >
    )
}

export default StatusCliente
