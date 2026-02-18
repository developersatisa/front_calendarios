import { FC, useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { atisaStyles, getSecondaryButtonStyles } from '../../../../styles/atisaStyles'
import SharedPagination from '../../../../components/pagination/SharedPagination'
import { Cliente, getAllClientes } from '../../../../api/clientes'
import { ClienteProcesoHito } from '../../../../api/clienteProcesoHitos'
import { ClienteProcesoHitoCumplimiento } from '../../../../api/clienteProcesoHitoCumplimientos'
import { getStatusTodosClientes, getStatusTodosClientesByUser, HitoCompletoConInfo } from '../../../../api/statusTodosClientes'
import { useAuth } from '../../../../modules/auth/core/Auth'
import api from '../../../../api/axiosConfig'
import { getAllSubdepartamentos, Subdepartamento } from '../../../../api/subdepartamentos'
import Select from 'react-select'

// Usamos la interfaz del API optimizado
type HitoConInfo = HitoCompletoConInfo

const StatusTodosClientes: FC = () => {
    const navigate = useNavigate()
    const { isAdmin, currentUser } = useAuth()
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
    const [sortField, setSortField] = useState<'cliente' | 'proceso' | 'hito' | 'estado' | 'fecha_limite' | 'hora_limite' | 'fecha_estado' | 'tipo' | 'departamento' | 'estado_proceso' | 'critico' | 'usuario' | 'observacion'>('fecha_limite')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [cumplimientosPorHito, setCumplimientosPorHito] = useState<Record<number, ClienteProcesoHitoCumplimiento[]>>({})
    const [subdepartamentos, setSubdepartamentos] = useState<Subdepartamento[]>([])
    const [selectedDepartamentos, setSelectedDepartamentos] = useState<string[]>([])

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
            let response
            if (isAdmin) {
                response = await getStatusTodosClientes()
            } else {
                if (!currentUser?.email) {
                    console.error('El usuario no tiene email configurado')
                    setLoading(false)
                    return
                }
                response = await getStatusTodosClientesByUser(currentUser.email)
            }
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
        cargarSubdepartamentos()
    }, [isAdmin, currentUser])

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

    const formatDateTime = (dateTime: string | null) => {
        if (!dateTime) return '-'
        const d = new Date(dateTime)
        return d.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
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
        setSelectedDepartamentos([])
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

            if (!isAdmin && currentUser?.email) {
                params.append('email', currentUser.email)
            }

            // Determinar la URL base según el rol
            const baseUrl = isAdmin
                ? '/status-todos-clientes/exportar-excel'
                : '/cliente-proceso-hitos/status-todos-clientes/exportar-excel'

            // Construir URL completa
            const url = `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`

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
    const handleSort = (field: 'cliente' | 'proceso' | 'hito' | 'estado' | 'fecha_limite' | 'hora_limite' | 'fecha_estado' | 'tipo' | 'departamento' | 'estado_proceso' | 'critico' | 'usuario' | 'observacion') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Función para obtener el icono de ordenamiento
    const getSortIcon = (field: 'cliente' | 'proceso' | 'hito' | 'estado' | 'fecha_limite' | 'hora_limite' | 'fecha_estado' | 'tipo' | 'departamento' | 'estado_proceso' | 'critico' | 'usuario' | 'observacion') => {
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


                case 'departamento':
                    const depA = `${a.codSubDepar || ''} ${a.departamento_cliente || ''}`
                    const depB = `${b.codSubDepar || ''} ${b.departamento_cliente || ''}`
                    comparison = depA.localeCompare(depB, 'es', { sensitivity: 'base' })
                    break

                case 'estado_proceso':
                    const pEstA = a.estado_proceso || ''
                    const pEstB = b.estado_proceso || ''
                    comparison = pEstA.localeCompare(pEstB, 'es', { sensitivity: 'base' })
                    break

                case 'critico':
                    // Ordenar por booleano (clave vs no clave)
                    const critA = a.critico ? 1 : 0
                    const critB = b.critico ? 1 : 0
                    comparison = critA - critB
                    break

                case 'usuario':
                    const userA = a.ultimo_cumplimiento?.usuario || ''
                    const userB = b.ultimo_cumplimiento?.usuario || ''
                    comparison = userA.localeCompare(userB, 'es', { sensitivity: 'base' })
                    break

                case 'observacion':
                    const obsA = a.ultimo_cumplimiento?.observacion || ''
                    const obsB = b.ultimo_cumplimiento?.observacion || ''
                    comparison = obsA.localeCompare(obsB, 'es', { sensitivity: 'base' })
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

            const matchesDepartamento = selectedDepartamentos.length === 0 || (hito.codSubDepar && selectedDepartamentos.includes(hito.codSubDepar!))

            return matchesSearch && matchesHito && matchesProceso && matchesCliente && matchesEstado && matchesTipo && matchesFecha && matchesDepartamento
        })

        return sortHitos(filtrados)
    }, [hitos, debouncedSearchTerm, selectedHito, selectedProceso, selectedCliente, selectedEstados, selectedTipos, fechaDesde, fechaHasta, selectedDepartamentos, sortField, sortDirection, cumplimientosPorHito])

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
                                Status de Hitos - Todos los Clientes
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
                                Vista global de todos los hitos de todos los clientes
                            </p>
                        </div>

                        {/* Columna derecha: Toggle Filtros */}
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
                            {/* Filtro Cliente */}
                            <div className="col-md-3">
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Cliente</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={selectedCliente}
                                    onChange={(e) => setSelectedCliente(e.target.value)}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        color: 'white',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <option value="" style={{ color: 'black' }}>Todos los clientes</option>
                                    {clientesUnicos.map((cliente) => (
                                        <option key={cliente.id} value={cliente.id} style={{ color: 'black' }}>{cliente.nombre}</option>
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
                                    {hitosUnicos.map((hito) => (
                                        <option key={hito.id} value={hito.id} style={{ color: 'black' }}>{hito.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Fechas en la misma fila si caben, o nueva fila. Vamos a poner fechas en una fila abajo para no saturar */}
                        </div>

                        <div className="row g-3 mt-1">
                            {/* Fecha Desde */}
                            <div className="col-md-3">
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Fecha Límite Desde</label>
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
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Fecha Límite Hasta</label>
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

                            {/* Filtro Departamento (Cubo) */}
                            <div className="col-md-6">
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Cubos</label>
                                <Select
                                    isMulti
                                    options={subdepartamentos
                                        .filter(subDep => subDep.codSubDepar !== null)
                                        .map(subDep => ({
                                            value: subDep.codSubDepar!,
                                            label: `${subDep.codSubDepar?.substring(4)} - ${subDep.nombre || ''}`
                                        }))
                                    }
                                    value={subdepartamentos
                                        .filter(subDep => subDep.codSubDepar !== null && selectedDepartamentos.includes(subDep.codSubDepar!))
                                        .map(subDep => ({
                                            value: subDep.codSubDepar!,
                                            label: `${subDep.codSubDepar?.substring(4)} - ${subDep.nombre || ''}`
                                        }))
                                    }
                                    onChange={(selectedOptions) => {
                                        setSelectedDepartamentos(selectedOptions ? (selectedOptions as any).map((opt: any) => opt.value) : [])
                                    }}
                                    placeholder="Seleccionar cubos..."
                                    noOptionsMessage={() => "No hay opciones"}
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        control: (base) => ({
                                            ...base,
                                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                            color: 'white',
                                            minHeight: '31px',
                                            borderRadius: '6px'
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            backgroundColor: 'white',
                                            zIndex: 9999
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isFocused ? atisaStyles.colors.light : 'white',
                                            color: atisaStyles.colors.dark,
                                            cursor: 'pointer',
                                            ':active': {
                                                backgroundColor: atisaStyles.colors.secondary
                                            }
                                        }),
                                        multiValue: (base) => ({
                                            ...base,
                                            backgroundColor: atisaStyles.colors.secondary,
                                            borderRadius: '4px',
                                        }),
                                        multiValueLabel: (base) => ({
                                            ...base,
                                            color: 'white',
                                            fontSize: '12px'
                                        }),
                                        multiValueRemove: (base) => ({
                                            ...base,
                                            color: 'white',
                                            ':hover': {
                                                backgroundColor: '#d32f2f',
                                                color: 'white',
                                            },
                                        }),
                                        placeholder: (base) => ({
                                            ...base,
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            fontSize: '14px'
                                        }),
                                        input: (base) => ({
                                            ...base,
                                            color: 'white'
                                        }),
                                        singleValue: (base) => ({
                                            ...base,
                                            color: 'white'
                                        }),
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
                                <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Responsable</label>
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
            </header>

            <div className="p-4 flex-grow-1">
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
                                    <th className="cursor-pointer user-select-none" onClick={() => handleSort('cliente')} style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', color: 'white', backgroundColor: atisaStyles.colors.primary, cursor: 'pointer' }}>
                                        Cliente {getSortIcon('cliente')}
                                    </th>
                                    <th className="cursor-pointer user-select-none" onClick={() => handleSort('departamento')} style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', color: 'white', backgroundColor: atisaStyles.colors.primary, cursor: 'pointer' }}>
                                        Cubo {getSortIcon('departamento')}
                                    </th>
                                    <th className="cursor-pointer user-select-none" onClick={() => handleSort('proceso')} style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', color: 'white', backgroundColor: atisaStyles.colors.primary, cursor: 'pointer' }}>
                                        Proceso {getSortIcon('proceso')}
                                    </th>
                                    <th className="cursor-pointer user-select-none" onClick={() => handleSort('estado_proceso')} style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', color: 'white', backgroundColor: atisaStyles.colors.primary, cursor: 'pointer' }}>
                                        Estado Proceso {getSortIcon('estado_proceso')}
                                    </th>
                                    <th className="cursor-pointer user-select-none" onClick={() => handleSort('hito')} style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', color: 'white', backgroundColor: atisaStyles.colors.primary, cursor: 'pointer' }}>
                                        Hito {getSortIcon('hito')}
                                    </th>
                                    <th className="cursor-pointer user-select-none" onClick={() => handleSort('tipo')} style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', color: 'white', backgroundColor: atisaStyles.colors.primary, cursor: 'pointer' }}>
                                        Responsable {getSortIcon('tipo')}
                                    </th>
                                    <th className="cursor-pointer user-select-none" onClick={() => handleSort('critico')} style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', color: 'white', backgroundColor: atisaStyles.colors.primary, cursor: 'pointer' }}>
                                        Clave {getSortIcon('critico')}
                                    </th>
                                    <th className="cursor-pointer user-select-none" onClick={() => handleSort('estado')} style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', color: 'white', backgroundColor: atisaStyles.colors.primary, cursor: 'pointer' }}>
                                        Estado {getSortIcon('estado')}
                                    </th>
                                    <th className="cursor-pointer user-select-none" onClick={() => handleSort('fecha_limite')} style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', color: 'white', backgroundColor: atisaStyles.colors.primary, cursor: 'pointer' }}>
                                        Fecha / Hora Límite {getSortIcon('fecha_limite')}
                                    </th>
                                    <th className="cursor-pointer user-select-none" onClick={() => handleSort('fecha_estado')} style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', color: 'white', backgroundColor: atisaStyles.colors.primary, cursor: 'pointer' }}>
                                        Fecha Actualización {getSortIcon('fecha_estado')}
                                    </th>
                                    <th className="cursor-pointer user-select-none" onClick={() => handleSort('usuario')} style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', color: 'white', backgroundColor: atisaStyles.colors.primary, cursor: 'pointer' }}>
                                        Gestor {getSortIcon('usuario')}
                                    </th>
                                    <th className="cursor-pointer user-select-none" onClick={() => handleSort('observacion')} style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', color: 'white', backgroundColor: atisaStyles.colors.primary, cursor: 'pointer' }}>
                                        Observaciones {getSortIcon('observacion')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={13}
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
                                            colSpan={13}
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

                                        // Estilos para el badge de fecha límite
                                        let badgeColors = { bg: '#f5f5f5', color: '#616161', border: '#e0e0e0' }

                                        if (isFinalized) {
                                            if (finalizadoFuera) {
                                                badgeColors = { bg: '#fff3e0', color: '#ef6c00', border: '#ffe0b2' } // Naranja (Finalizado fuera de plazo)
                                            } else {
                                                badgeColors = { bg: '#e8f5e8', color: '#2e7d32', border: '#c8e6c9' } // Verde (Finalizado en plazo)
                                            }
                                        } else {
                                            if (venceHoy) {
                                                badgeColors = { bg: '#fff8e1', color: '#f9a825', border: '#ffecb3' } // Amarillo (Vence hoy)
                                            } else if (estadoVenc === 'vencido') {
                                                badgeColors = { bg: '#ffebee', color: '#c62828', border: '#ffcdd2' } // Rojo (Vencido)
                                            } else if (estadoVenc === 'sin_fecha') {
                                                badgeColors = { bg: '#f5f5f5', color: '#616161', border: '#e0e0e0' } // Gris (Sin fecha)
                                            } else {
                                                badgeColors = { bg: '#e0f2f1', color: '#00695c', border: '#b2dfdb' } // Teal (En plazo)
                                            }
                                        }

                                        // Cálculo del texto de estado
                                        let estadoTexto = isFinalized ? 'Cumplido' : 'Pendiente'
                                        if (isFinalized) {
                                            estadoTexto = finalizadoFuera ? 'Cumplido fuera de plazo' : 'Cumplido en plazo'
                                        } else {
                                            if (venceHoy) {
                                                estadoTexto = 'Vence hoy'
                                            } else if (estadoVenc === 'vencido') {
                                                estadoTexto = 'Pendiente fuera de plazo'
                                            } else if (estadoVenc === 'en_plazo') {
                                                estadoTexto = 'Pendiente en plazo'
                                            }
                                        }

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
                                                <td style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.primary, fontWeight: '600', padding: '16px 12px', verticalAlign: 'middle', fontSize: '13px' }}>
                                                    <span title={hito.cliente_nombre || 'No disponible'}>
                                                        {hito.cliente_nombre || 'No disponible'}
                                                    </span>
                                                </td>
                                                <td style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.dark, padding: '16px 12px', verticalAlign: 'middle', fontSize: '13px' }}>
                                                    {hito.ultimo_cumplimiento && hito.ultimo_cumplimiento.codSubDepar ? (
                                                        `${hito.ultimo_cumplimiento.codSubDepar!.substring(4)} - ${hito.ultimo_cumplimiento.departamento || '-'}`
                                                    ) : hito.codSubDepar ? (
                                                        `${hito.codSubDepar!.substring(4)} - ${hito.departamento_cliente || hito.departamento || '-'}`
                                                    ) : (
                                                        hito.departamento_cliente || hito.departamento || '-'
                                                    )}
                                                </td>
                                                <td style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.dark, padding: '16px 12px', verticalAlign: 'middle', fontSize: '13px' }}>
                                                    {hito.proceso_nombre || '-'}
                                                </td>
                                                <td style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.dark, padding: '16px 12px', verticalAlign: 'middle', fontSize: '13px' }}>
                                                    {hito.estado_proceso || '-'}
                                                </td>
                                                <td style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.primary, fontWeight: '600', padding: '16px 12px', verticalAlign: 'middle', fontSize: '13px' }}>
                                                    {hito.hito_nombre || '-'}
                                                </td>
                                                <td style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.dark, padding: '16px 12px', verticalAlign: 'middle', fontSize: '13px' }}>
                                                    {hito.tipo || '-'}
                                                </td>
                                                <td style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.dark, padding: '16px 12px', verticalAlign: 'middle', fontSize: '13px' }}>
                                                    {hito.critico ? 'Clave' : 'No clave'}
                                                </td>
                                                <td style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.dark, padding: '16px 12px', verticalAlign: 'middle', fontSize: '13px' }}>
                                                    <span style={{ backgroundColor: badgeColors.bg, color: badgeColors.color, padding: '4px 10px', borderRadius: '4px', border: `1px solid ${badgeColors.border}`, fontWeight: '600', fontSize: '11px', display: 'inline-block' }}>
                                                        {estadoTexto}
                                                    </span>
                                                </td>
                                                <td style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.dark, padding: '16px 12px', verticalAlign: 'middle', fontSize: '13px' }}>
                                                    {formatDate(hito.fecha_limite)} {formatTime(hito.hora_limite)}
                                                </td>
                                                <td style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.dark, padding: '16px 12px', verticalAlign: 'middle', fontSize: '13px' }}>
                                                    {hito.fecha_estado ? formatDateTime(hito.fecha_estado) : '-'}
                                                </td>
                                                <td style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.dark, padding: '16px 12px', verticalAlign: 'middle', fontSize: '13px' }}>
                                                    {hito.ultimo_cumplimiento?.usuario || '-'}
                                                </td>
                                                <td style={{ fontFamily: atisaStyles.fonts.secondary, color: atisaStyles.colors.dark, padding: '16px 12px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                    {hito.ultimo_cumplimiento?.observacion ? (
                                                        <i
                                                            className="bi bi-chat-square-text-fill"
                                                            style={{ color: atisaStyles.colors.primary, fontSize: '16px', cursor: 'help' }}
                                                            title={hito.ultimo_cumplimiento.observacion}
                                                        ></i>
                                                    ) : (
                                                        <span style={{ color: '#adb5bd' }}>-</span>
                                                    )}
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
        </div>
    )
}

export default StatusTodosClientes
