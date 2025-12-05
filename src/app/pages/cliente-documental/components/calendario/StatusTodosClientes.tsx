import { FC, useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { atisaStyles, getSecondaryButtonStyles } from '../../../../styles/atisaStyles'
import SharedPagination from '../../../../components/pagination/SharedPagination'
import { Cliente, getAllClientes } from '../../../../api/clientes'
import { ClienteProcesoHito } from '../../../../api/clienteProcesoHitos'
import { ClienteProcesoHitoCumplimiento } from '../../../../api/clienteProcesoHitoCumplimientos'
import { getStatusTodosClientes, HitoCompletoConInfo } from '../../../../api/statusTodosClientes'
import api from '../../../../api/axiosConfig'

// Usamos la interfaz del API optimizado
type HitoConInfo = HitoCompletoConInfo

const StatusTodosClientes: FC = () => {
    const navigate = useNavigate()
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
    const [selectedCliente, setSelectedCliente] = useState('')
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
    const [clientesList, setClientesList] = useState<Cliente[]>([])
    const [showFilters, setShowFilters] = useState(false)
    const [sortField, setSortField] = useState<'cliente' | 'proceso' | 'hito' | 'estado' | 'fecha_limite' | 'hora_limite' | 'fecha_estado' | 'tipo'>('fecha_limite')
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

    // Función optimizada para cargar todos los hitos en una sola llamada
    const cargarTodosLosHitos = async () => {
        setLoading(true)
        try {
            // Llamada única optimizada al backend
            const response = await getStatusTodosClientes()
            const todosLosHitos = response.hitos || []

            setHitos(todosLosHitos)
            setTotal(response.total || todosLosHitos.length)

            // Extraer lista única de clientes para el filtro
            const clientesUnicosMap = new Map<string, Cliente>()
            todosLosHitos.forEach(hito => {
                if (hito.cliente_id && !clientesUnicosMap.has(hito.cliente_id)) {
                    clientesUnicosMap.set(hito.cliente_id, {
                        idcliente: hito.cliente_id,
                        razsoc: hito.cliente_nombre,
                        cif: null,
                        cif_empresa: null,
                        direccion: null,
                        localidad: null,
                        provincia: null,
                        cpostal: null,
                        codigop: null,
                        pais: null,
                        cif_factura: null
                    })
                }
            })
            setClientesList(Array.from(clientesUnicosMap.values()))

            // Mapear cumplimientos desde la respuesta optimizada
            const cumplimientosMap: Record<number, ClienteProcesoHitoCumplimiento[]> = {}
            todosLosHitos.forEach(hito => {
                if (hito.ultimo_cumplimiento) {
                    cumplimientosMap[hito.id] = [hito.ultimo_cumplimiento as ClienteProcesoHitoCumplimiento]
                } else {
                    cumplimientosMap[hito.id] = []
                }
            })
            setCumplimientosPorHito(cumplimientosMap)
        } catch (error) {
            console.error('Error cargando hitos:', error)
            setHitos([])
            setTotal(0)
            setCumplimientosPorHito({})
            setClientesList([])
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
        }, 300)

        return () => {
            clearTimeout(timer)
            setSearching(false)
        }
    }, [searchTerm])

    // Cargar datos iniciales
    useEffect(() => {
        cargarTodosLosHitos()
    }, [])

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
        setSelectedCliente('')
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

            if (selectedCliente) {
                params.append('cliente_id', selectedCliente)
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
            const url = `/status-todos-clientes/exportar-excel${params.toString() ? `?${params.toString()}` : ''}`

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
            let filename = `status_hitos_todos_clientes_${getTodayDate()}.xlsx`
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
    const handleSort = (field: 'cliente' | 'proceso' | 'hito' | 'estado' | 'fecha_limite' | 'hora_limite' | 'fecha_estado' | 'tipo') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Función para obtener el icono de ordenamiento
    const getSortIcon = (field: 'cliente' | 'proceso' | 'hito' | 'estado' | 'fecha_limite' | 'hora_limite' | 'fecha_estado' | 'tipo') => {
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
                case 'cliente':
                    const clienteA = a.cliente_nombre || ''
                    const clienteB = b.cliente_nombre || ''
                    comparison = clienteA.localeCompare(clienteB, 'es', { sensitivity: 'base' })
                    break

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
                normalizeText(hito.cliente_nombre).includes(searchNormalized) ||
                normalizeText(hito.proceso_nombre).includes(searchNormalized) ||
                normalizeText(hito.hito_nombre).includes(searchNormalized) ||
                normalizeText(hito.estado).includes(searchNormalized) ||
                normalizeText(hito.tipo).includes(searchNormalized)

            const matchesHito = !selectedHito || hito.hito_id?.toString() === selectedHito
            const matchesProceso = !selectedProceso || hito.proceso_nombre === selectedProceso
            const matchesCliente = !selectedCliente || hito.cliente_id === selectedCliente

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

            return matchesSearch && matchesHito && matchesProceso && matchesCliente && matchesEstado && matchesTipo && matchesFecha
        })

        return sortHitos(filtrados)
    }, [hitos, debouncedSearchTerm, selectedHito, selectedProceso, selectedCliente, selectedEstados, selectedTipos, fechaDesde, fechaHasta, sortField, sortDirection, cumplimientosPorHito])

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

    // Obtener clientes únicos para el filtro
    const clientesUnicos = useMemo(() => {
        const clientesSet = new Map<string, { id: string, nombre: string }>()
        hitos.forEach(hito => {
            if (hito.cliente_id && hito.cliente_nombre) {
                clientesSet.set(hito.cliente_id, {
                    id: hito.cliente_id,
                    nombre: hito.cliente_nombre
                })
            }
        })
        return Array.from(clientesSet.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
    }, [hitos])

    // Obtener hitos únicos para el filtro
    const hitosUnicos = useMemo(() => {
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', width: '100%' }}>
                    {/* Columna izquierda: Botón Volver */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <button
                            className="btn"
                            onClick={() => navigate(`/clientes`)}
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
                            Volver a Gestión de Clientes
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
                            Status de Hitos - Todos los Clientes
                        </h2>
                        <p
                            style={{
                                margin: '8px 0 0 0',
                                fontSize: '1.1rem',
                                opacity: 0.9
                            }}
                        >
                            Vista global de todos los hitos de todos los clientes
                        </p>
                    </div>

                    {/* Columna derecha: Espacio vacío */}
                    <div></div>
                </div>
            </div>

            {/* Panel de filtros - Similar a StatusCliente pero con filtro adicional de cliente */}
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
                        {/* Búsqueda global */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-12">
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
                                    Buscar por cliente, proceso, hito, estado o tipo
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
                        </div>

                        {/* Separador visual */}
                        <div style={{
                            height: '1px',
                            backgroundColor: atisaStyles.colors.light,
                            margin: '1.5rem 0',
                            opacity: 0.5
                        }}></div>

                        {/* Filtros principales: Cliente, Hito y Proceso */}
                        <div className="row g-3 mb-4">
                            {/* Filtro por cliente */}
                            <div className="col-md-4">
                                <label
                                    style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        fontWeight: '600',
                                        color: atisaStyles.colors.primary,
                                        marginBottom: '8px',
                                        display: 'block'
                                    }}
                                >
                                    <i className="bi bi-building me-2"></i>
                                    Cliente
                                </label>
                                <select
                                    className="form-select"
                                    value={selectedCliente}
                                    onChange={(e) => setSelectedCliente(e.target.value)}
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
                                >
                                    <option value="">Todos los clientes</option>
                                    {clientesUnicos.map((cliente) => (
                                        <option key={cliente.id} value={cliente.id}>
                                            {cliente.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por hito */}
                            <div className="col-md-4">
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
                                >
                                    <option value="">Todos los hitos</option>
                                    {hitosUnicos.map((hito) => (
                                        <option key={hito.id} value={hito.id}>
                                            {hito.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por proceso */}
                            <div className="col-md-4">
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
                                >
                                    <option value="">Todos los procesos</option>
                                    {procesosUnicos.map((proceso) => (
                                        <option key={proceso} value={proceso}>
                                            {proceso}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Separador visual */}
                        <div style={{
                            height: '1px',
                            backgroundColor: atisaStyles.colors.light,
                            margin: '1.5rem 0',
                            opacity: 0.5
                        }}></div>

                        {/* Filtros de fecha */}
                        <div className="row g-3 mb-4">
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
                                    <i className="bi bi-calendar-date me-2"></i>
                                    Fecha límite desde
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
                                />
                            </div>

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
                                    <i className="bi bi-calendar-date me-2"></i>
                                    Fecha límite hasta
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
                                />
                            </div>
                        </div>

                        {/* Separador visual */}
                        <div style={{
                            height: '1px',
                            backgroundColor: atisaStyles.colors.light,
                            margin: '1.5rem 0',
                            opacity: 0.5
                        }}></div>

                        {/* Filtros de Estados y Tipos */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <label
                                    style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        fontWeight: '600',
                                        color: atisaStyles.colors.primary,
                                        marginBottom: '12px',
                                        display: 'block'
                                    }}
                                >
                                    <i className="bi bi-check-circle me-2"></i>
                                    Estados
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    <button
                                        className="btn btn-sm"
                                        style={{
                                            backgroundColor: selectedEstados.size === 0 ? atisaStyles.colors.secondary : 'white',
                                            color: selectedEstados.size === 0 ? 'white' : atisaStyles.colors.primary,
                                            border: `1px solid ${atisaStyles.colors.light}`,
                                            borderRadius: '20px',
                                            padding: '6px 12px',
                                            fontWeight: 600,
                                            position: 'relative'
                                        }}
                                        onClick={() => setSelectedEstados(new Set())}
                                    >
                                        Todos
                                        {selectedEstados.size > 0 && (
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    right: '-8px',
                                                    backgroundColor: '#ef4444',
                                                    color: 'white',
                                                    borderRadius: '50%',
                                                    width: '20px',
                                                    height: '20px',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontFamily: atisaStyles.fonts.secondary
                                                }}
                                            >
                                                {selectedEstados.size}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        className="btn btn-sm"
                                        style={{
                                            backgroundColor: selectedEstados.has('cumplido_en_plazo') ? '#16a34a' : 'white',
                                            color: selectedEstados.has('cumplido_en_plazo') ? 'white' : atisaStyles.colors.primary,
                                            border: `1px solid ${atisaStyles.colors.light}`,
                                            borderRadius: '20px',
                                            padding: '6px 12px',
                                            fontWeight: 600
                                        }}
                                        onClick={() => toggleEstado('cumplido_en_plazo')}
                                    >
                                        Cumplido en plazo
                                    </button>
                                    <button
                                        className="btn btn-sm"
                                        style={{
                                            backgroundColor: selectedEstados.has('cumplido_fuera_plazo') ? '#b45309' : 'white',
                                            color: selectedEstados.has('cumplido_fuera_plazo') ? 'white' : atisaStyles.colors.primary,
                                            border: `1px solid ${atisaStyles.colors.light}`,
                                            borderRadius: '20px',
                                            padding: '6px 12px',
                                            fontWeight: 600
                                        }}
                                        onClick={() => toggleEstado('cumplido_fuera_plazo')}
                                    >
                                        Cumplido fuera de plazo
                                    </button>
                                    <button
                                        className="btn btn-sm"
                                        style={{
                                            backgroundColor: selectedEstados.has('vence_hoy') ? '#dc2626' : 'white',
                                            color: selectedEstados.has('vence_hoy') ? 'white' : atisaStyles.colors.primary,
                                            border: `1px solid ${atisaStyles.colors.light}`,
                                            borderRadius: '20px',
                                            padding: '6px 12px',
                                            fontWeight: 600
                                        }}
                                        onClick={() => toggleEstado('vence_hoy')}
                                    >
                                        Vence hoy
                                    </button>
                                    <button
                                        className="btn btn-sm"
                                        style={{
                                            backgroundColor: selectedEstados.has('pendiente_fuera_plazo') ? '#ef4444' : 'white',
                                            color: selectedEstados.has('pendiente_fuera_plazo') ? 'white' : atisaStyles.colors.primary,
                                            border: `1px solid ${atisaStyles.colors.light}`,
                                            borderRadius: '20px',
                                            padding: '6px 12px',
                                            fontWeight: 600
                                        }}
                                        onClick={() => toggleEstado('pendiente_fuera_plazo')}
                                    >
                                        Pendiente fuera de plazo
                                    </button>
                                    <button
                                        className="btn btn-sm"
                                        style={{
                                            backgroundColor: selectedEstados.has('pendiente_en_plazo') ? atisaStyles.colors.accent : 'white',
                                            color: selectedEstados.has('pendiente_en_plazo') ? 'white' : atisaStyles.colors.primary,
                                            border: `1px solid ${atisaStyles.colors.light}`,
                                            borderRadius: '20px',
                                            padding: '6px 12px',
                                            fontWeight: 600
                                        }}
                                        onClick={() => toggleEstado('pendiente_en_plazo')}
                                    >
                                        Pendiente en plazo
                                    </button>
                                </div>
                            </div>

                            {tiposUnicos.length > 0 && (
                                <div className="col-md-6">
                                    <label
                                        style={{
                                            fontFamily: atisaStyles.fonts.secondary,
                                            fontWeight: '600',
                                            color: atisaStyles.colors.primary,
                                            marginBottom: '12px',
                                            display: 'block'
                                        }}
                                    >
                                        <i className="bi bi-tag me-2"></i>
                                        Tipos de Hito
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        <button
                                            className="btn btn-sm"
                                            style={{
                                                backgroundColor: selectedTipos.size === 0 ? atisaStyles.colors.secondary : 'white',
                                                color: selectedTipos.size === 0 ? 'white' : atisaStyles.colors.primary,
                                                border: `1px solid ${atisaStyles.colors.light}`,
                                                borderRadius: '20px',
                                                padding: '6px 12px',
                                                fontWeight: 600,
                                                position: 'relative'
                                            }}
                                            onClick={() => setSelectedTipos(new Set())}
                                        >
                                            Todos
                                            {selectedTipos.size > 0 && (
                                                <span
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-8px',
                                                        right: '-8px',
                                                        backgroundColor: '#ef4444',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        width: '20px',
                                                        height: '20px',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontFamily: atisaStyles.fonts.secondary
                                                    }}
                                                >
                                                    {selectedTipos.size}
                                                </span>
                                            )}
                                        </button>
                                        {tiposUnicos.map((tipo) => (
                                            <button
                                                key={tipo}
                                                className="btn btn-sm"
                                                style={{
                                                    backgroundColor: selectedTipos.has(tipo) ? atisaStyles.colors.primary : 'white',
                                                    color: selectedTipos.has(tipo) ? 'white' : atisaStyles.colors.primary,
                                                    border: `1px solid ${atisaStyles.colors.light}`,
                                                    borderRadius: '20px',
                                                    padding: '6px 12px',
                                                    fontWeight: 600
                                                }}
                                                onClick={() => toggleTipo(tipo)}
                                            >
                                                {tipo}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Separador visual */}
                        <div style={{
                            height: '1px',
                            backgroundColor: atisaStyles.colors.light,
                            margin: '1.5rem 0',
                            opacity: 0.5
                        }}></div>

                        {/* Botones de acción */}
                        <div className="row g-3">
                            <div className="col-md-12">
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button
                                        className="btn"
                                        onClick={exportarExcel}
                                        disabled={exporting}
                                        style={{
                                            backgroundColor: exporting ? '#9ca3af' : '#16a34a',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontFamily: atisaStyles.fonts.secondary,
                                            fontWeight: '600',
                                            padding: '12px 24px',
                                            fontSize: '14px',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: exporting ? 'not-allowed' : 'pointer',
                                            opacity: exporting ? 0.7 : 1
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!exporting) {
                                                e.currentTarget.style.backgroundColor = '#15803d'
                                                e.currentTarget.style.transform = 'translateY(-2px)'
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.3)'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!exporting) {
                                                e.currentTarget.style.backgroundColor = '#16a34a'
                                                e.currentTarget.style.transform = 'translateY(0)'
                                                e.currentTarget.style.boxShadow = 'none'
                                            }
                                        }}
                                    >
                                        {exporting ? (
                                            <>
                                                <div
                                                    className="spinner-border spinner-border-sm"
                                                    role="status"
                                                    style={{
                                                        width: '16px',
                                                        height: '16px',
                                                        borderWidth: '2px'
                                                    }}
                                                >
                                                    <span className="visually-hidden">Exportando...</span>
                                                </div>
                                                Exportando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-file-earmark-excel"></i>
                                                Exportar a Excel
                                            </>
                                        )}
                                    </button>
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

            {/* Tabla de hitos */}
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
                                    onClick={() => handleSort('cliente')}
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
                                    Cliente {getSortIcon('cliente')}
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
                                        colSpan={8}
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
                                        colSpan={8}
                                        className="text-center py-4"
                                        style={{
                                            backgroundColor: '#f8f9fa',
                                            fontFamily: atisaStyles.fonts.secondary,
                                            padding: '2rem',
                                            color: atisaStyles.colors.dark
                                        }}
                                    >
                                        <i className="bi bi-info-circle me-2" style={{ color: atisaStyles.colors.dark }}></i>
                                        {debouncedSearchTerm || selectedHito || selectedProceso || selectedCliente || selectedEstados.size > 0 || selectedTipos.size > 0 || fechaDesde || fechaHasta
                                            ? 'No se encontraron hitos con los filtros aplicados'
                                            : 'No hay hitos registrados'
                                        }
                                    </td>
                                </tr>
                            ) : (
                                paginatedHitos.map((hito, index) => {
                                    const isFinalized = hito.estado === 'Finalizado'
                                    const isNuevo = hito.estado === 'Nuevo'
                                    const estadoVenc = getEstadoVencimiento(hito.fecha_limite, hito.estado)
                                    const finalizadoFuera = isFinalizadoFueraDePlazo(hito)
                                    const venceHoy = isNuevo && estadoVenc === 'hoy'

                                    return (
                                        <tr
                                            key={`${hito.cliente_id}-${hito.id}`}
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
                                                <span title={hito.cliente_nombre || 'No disponible'}>
                                                    {hito.cliente_nombre || 'No disponible'}
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
                                                {finalizadoFuera ? (
                                                    <span style={{ backgroundColor: '#b45309', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                                        Cumplido fuera de plazo
                                                    </span>
                                                ) : isFinalized ? (
                                                    <span style={{ backgroundColor: '#16a34a', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                                        Cumplido en plazo
                                                    </span>
                                                ) : venceHoy ? (
                                                    <span style={{ backgroundColor: '#dc2626', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                                        Vence hoy
                                                    </span>
                                                ) : estadoVenc === 'vencido' ? (
                                                    <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                                        Pendiente fuera de plazo
                                                    </span>
                                                ) : (
                                                    <span style={{ backgroundColor: atisaStyles.colors.accent, color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                                        Pendiente en plazo
                                                    </span>
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
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {hitosFiltrados.length > itemsPerPage && (
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
                )}
            </div>
        </div>
    )
}

export default StatusTodosClientes
