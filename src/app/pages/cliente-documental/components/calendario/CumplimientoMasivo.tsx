import { FC, useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { atisaStyles, getSecondaryButtonStyles } from '../../../../styles/atisaStyles'
import { getStatusTodosClientes, getStatusTodosClientesByUser, HitoCompletoConInfo } from '../../../../api/statusTodosClientes'
import Select, { components } from 'react-select'
import { useAuth } from '../../../../modules/auth/core/Auth'
import SharedPagination from '../../../../components/pagination/SharedPagination'
import CumplimentarHitosMasivoModal from './CumplimentarHitosMasivoModal'
import { getAllSubdepartamentos, Subdepartamento } from '../../../../api/subdepartamentos'

// Componente personalizado para opción con checkbox
const CheckboxOption = (props: any) => {
    return (
        <components.Option {...props}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                    type="checkbox"
                    checked={props.isSelected}
                    onChange={() => null}
                    style={{ marginRight: '8px' }}
                    className="form-check-input"
                />
                <label>{props.label}</label>
            </div>
        </components.Option>
    );
};

const CumplimientoMasivo: FC = () => {
    const navigate = useNavigate()
    const { currentUser, isAdmin } = useAuth()

    // Datos y carga
    const [loading, setLoading] = useState(false)
    const [allItems, setAllItems] = useState<HitoCompletoConInfo[]>([])

    // Estados para filtros
    const getTodayDate = () => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    }
    const [fechaDesde, setFechaDesde] = useState<string>(getTodayDate())
    const [fechaHasta, setFechaHasta] = useState<string>('')
    const [selectedClienteId, setSelectedClienteId] = useState<string>('')

    // Filtros Multi-select (IDs)
    const [selectedProcesos, setSelectedProcesos] = useState<{ value: number; label: string }[]>([])
    const [selectedHitos, setSelectedHitos] = useState<{ value: number; label: string }[]>([])
    const [filterClave, setFilterClave] = useState<'todas' | 'clave' | 'no_clave'>('todas')
    const [selectedResponsables, setSelectedResponsables] = useState<Set<string>>(new Set())
    const [selectedDepartamentos, setSelectedDepartamentos] = useState<string[]>([])
    const [subdepartamentos, setSubdepartamentos] = useState<Subdepartamento[]>([])

    // Paginación y Ordenación
    const [page, setPage] = useState(1)
    const [showFilters, setShowFilters] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [limit] = useState(10)
    const [sortField, setSortField] = useState<string>('fecha_limite')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // Selección
    const [selectedIds, setSelectedIds] = useState<number[]>([])

    // Modal
    const [showCumplimentarModal, setShowCumplimentarModal] = useState(false)

    // Cargar datos al montar
    useEffect(() => {
        loadAllData()
        cargarSubdepartamentos()
    }, [isAdmin, currentUser])

    const cargarSubdepartamentos = async () => {
        try {
            const response = await getAllSubdepartamentos(undefined, 1000, undefined, 'asc')
            setSubdepartamentos(response.subdepartamentos || [])
        } catch (error) {
            console.error('Error cargando subdepartamentos:', error)
        }
    }

    const loadAllData = async () => {
        if (!isAdmin && !currentUser?.email) return

        setLoading(true)
        try {
            let response
            if (isAdmin) {
                response = await getStatusTodosClientes()
            } else {
                response = await getStatusTodosClientesByUser(currentUser!.email!)
            }
            setAllItems(response.hitos || [])
        } catch (error) {
            console.error('Error al cargar datos:', error)
            setAllItems([])
        } finally {
            setLoading(false)
        }
    }

    // Derivar opciones para filtros basadas en los datos cargados
    const { clientesOpts, procesosOpts, hitosOpts, responsablesOpts } = useMemo(() => {
        const clientesMap = new Map<string, string>()
        const procesosMap = new Map<number, string>()
        const hitosMap = new Map<number, string>()
        const responsablesSet = new Set<string>()

        allItems.forEach(item => {
            if (item.cliente_id && item.cliente_nombre) {
                clientesMap.set(item.cliente_id, item.cliente_nombre)
            }
            if (item.proceso_id && item.proceso_nombre) {
                procesosMap.set(item.proceso_id, item.proceso_nombre)
            }
            if (item.hito_id && item.hito_nombre) {
                hitosMap.set(item.hito_id, item.hito_nombre)
            }
            if (item.tipo) {
                responsablesSet.add(item.tipo)
            }
        })

        const cOpts = Array.from(clientesMap.entries()).map(([id, nombre]) => ({
            id: id,
            nombre: `${nombre}`
        })).sort((a, b) => a.nombre.localeCompare(b.nombre))

        const pOpts = Array.from(procesosMap.entries()).map(([id, nombre]) => ({
            value: id,
            label: nombre
        })).sort((a, b) => a.label.localeCompare(b.label))

        const hOpts = Array.from(hitosMap.entries()).map(([id, nombre]) => ({
            value: id,
            label: nombre
        })).sort((a, b) => a.label.localeCompare(b.label))

        const rOpts = Array.from(responsablesSet).map(tipo => ({
            value: tipo,
            label: tipo
        })).sort((a, b) => a.label.localeCompare(b.label))

        return { clientesOpts: cOpts, procesosOpts: pOpts, hitosOpts: hOpts, responsablesOpts: rOpts }
    }, [allItems])


    // Función para normalizar texto
    const normalizeText = (text: string | null | undefined): string => {
        if (!text) return ''
        return String(text)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
    }

    // Filtrar items
    const filteredItems = useMemo(() => {
        return allItems.filter(item => {
            // Filtro Búsqueda
            if (searchTerm) {
                const search = normalizeText(searchTerm)
                const proc = normalizeText(item.proceso_nombre)
                const hito = normalizeText(item.hito_nombre)
                const cli = normalizeText(item.cliente_nombre)
                if (!proc.includes(search) && !hito.includes(search) && !cli.includes(search)) return false
            }

            // Filtro Cliente
            if (selectedClienteId && item.cliente_id !== selectedClienteId) return false

            // Filtro Fechas (sobre fecha_limite)
            if (fechaDesde) {
                if (item.fecha_limite < fechaDesde) return false
            }
            if (fechaHasta) {
                if (item.fecha_limite > fechaHasta) return false
            }

            // Filtro Procesos (Multi)
            if (selectedProcesos.length > 0) {
                const procIds = selectedProcesos.map(p => p.value)
                if (!procIds.includes(item.proceso_id)) return false
            }

            // Filtro Hitos (Multi)
            if (selectedHitos.length > 0) {
                const hitoIds = selectedHitos.map(h => h.value)
                if (!hitoIds.includes(item.hito_id)) return false
            }

            // Filtro Clave
            if (filterClave !== 'todas') {
                const isClave = filterClave === 'clave'
                if (Boolean(item.critico) !== isClave) return false
            }

            // Filtro Responsables (Multi)
            if (selectedResponsables.size > 0) {
                if (!item.tipo || !selectedResponsables.has(item.tipo)) return false
            }

            // Filtro Departamentos (Multi)
            if (selectedDepartamentos.length > 0) {
                if (!item.codSubDepar || !selectedDepartamentos.includes(item.codSubDepar)) return false
            }

            return true
        })
    }, [allItems, selectedClienteId, fechaDesde, fechaHasta, selectedProcesos, selectedHitos, searchTerm, filterClave, selectedResponsables, selectedDepartamentos])

    // Ordenar items
    const sortedItems = useMemo(() => {
        const sorted = [...filteredItems]
        sorted.sort((a, b) => {
            let valA: any = ''
            let valB: any = ''

            switch (sortField) {
                case 'cliente':
                    valA = a.cliente_nombre || ''
                    valB = b.cliente_nombre || ''
                    break
                case 'cubo':
                    valA = `${a.codSubDepar || ''} ${a.departamento_cliente || ''}`
                    valB = `${b.codSubDepar || ''} ${b.departamento_cliente || ''}`
                    break
                case 'proceso':
                    valA = a.proceso_nombre || ''
                    valB = b.proceso_nombre || ''
                    break
                case 'hito':
                    valA = a.hito_nombre || ''
                    valB = b.hito_nombre || ''
                    break
                case 'responsable':
                    valA = a.tipo || ''
                    valB = b.tipo || ''
                    break
                case 'clave':
                    valA = a.critico ? 1 : 0
                    valB = b.critico ? 1 : 0
                    break
                case 'estado':
                    valA = a.estado || ''
                    valB = b.estado || ''
                    break
                case 'fecha_limite':
                    valA = a.fecha_limite || ''
                    valB = b.fecha_limite || ''
                    break
                default:
                    return 0
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1
            return 0
        })
        return sorted
    }, [filteredItems, sortField, sortDirection])

    // Paginar items
    const paginatedItems = useMemo(() => {
        const start = (page - 1) * limit
        return sortedItems.slice(start, start + limit)
    }, [sortedItems, page, limit])

    // Funciones de manejo
    const handleResetFiltros = () => {
        setFechaDesde(getTodayDate())
        setFechaHasta('')
        setSelectedClienteId('')
        setSelectedProcesos([])
        setSelectedHitos([])
        setFilterClave('todas')
        setSelectedResponsables(new Set())
        setSelectedDepartamentos([])
        setSearchTerm('')
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

    const toggleResponsable = (tipo: string) => {
        const nuevos = new Set(selectedResponsables)
        if (nuevos.has(tipo)) {
            nuevos.delete(tipo)
        } else {
            nuevos.add(tipo)
        }
        setSelectedResponsables(nuevos)
        setPage(1)
    }

    const onSelectAllVisible = (checked: boolean) => {
        if (checked) {
            const visibleIds = filteredItems.map(i => i.id)
            const newIds = [...selectedIds]
            visibleIds.forEach(id => {
                if (!newIds.includes(id)) newIds.push(id)
            })
            setSelectedIds(newIds)
        } else {
            const visibleIds = filteredItems.map(i => i.id)
            setSelectedIds(selectedIds.filter(id => !visibleIds.includes(id)))
        }
    }

    const areAllVisibleSelected = filteredItems.length > 0 && filteredItems.every(i => selectedIds.includes(i.id))

    const handleMassSuccess = (count: number) => {
        loadAllData()
        setSelectedIds([])
        alert(`Se han cumplimentado ${count} hitos correctamente`)
    }

    const getSortIcon = (field: string) => {
        if (sortField !== field) return <i className='bi bi-arrow-down-up ms-1 text-muted' style={{ fontSize: '10px' }}></i>
        return <i className={`bi ${sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'} ms-1 text-white`} style={{ fontSize: '12px' }}></i>
    }

    // Funciones auxiliares para estado visual
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

    const isFinalizadoFueraDePlazo = (item: HitoCompletoConInfo): boolean => {
        if (item.estado !== 'Finalizado') return false
        if (!item.ultimo_cumplimiento) return false

        const c = item.ultimo_cumplimiento
        if (!c.fecha) return false
        const horaStr = c.hora ? (c.hora.includes(':') ? c.hora : `${c.hora}:00`) : '00:00:00'
        const fechaCumplimiento = new Date(`${c.fecha}T${horaStr.length === 5 ? horaStr + ':00' : horaStr}`)

        if (!item.fecha_limite) return false
        const limitTimeStr = item.hora_limite ? (item.hora_limite.includes(':') ? item.hora_limite : `${item.hora_limite}:00`) : '23:59:59'
        const fechaLimite = new Date(`${item.fecha_limite}T${limitTimeStr.length === 5 ? limitTimeStr + ':00' : limitTimeStr}`)

        return fechaCumplimiento.getTime() > fechaLimite.getTime()
    }

    // Funciones de renderizado
    const renderResponsable = (tipo: string) => {
        return <span className="text-gray-800 fw-bold">{tipo}</span>
    }

    const renderClave = (critico: number | boolean) => {
        return critico ?
            <span className="badge" style={{ backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', fontWeight: '600' }}>Clave</span> :
            <span className="text-muted small">No clave</span>
    }

    // Estilos extraídos
    const tableHeaderStyle = {
        fontFamily: atisaStyles.fonts.primary,
        fontWeight: 'bold',
        fontSize: '14px',
        padding: '16px 12px',
        borderBottom: `3px solid ${atisaStyles.colors.primary}`,
        color: atisaStyles.colors.primary,
        backgroundColor: atisaStyles.colors.light,
        cursor: 'pointer',
        whiteSpace: 'nowrap'
    }

    const tableCellStyleBase = {
        fontFamily: atisaStyles.fonts.secondary,
        padding: '16px 12px',
        verticalAlign: 'middle',
        fontSize: '13px'
    }

    return (
        <div style={{
            fontFamily: atisaStyles.fonts.secondary,
            backgroundColor: '#f8f9fa',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <header
                style={{
                    background: 'linear-gradient(135deg, #00505c 0%, #007b8a 100%)',
                    color: 'white',
                    boxShadow: '0 4px 20px rgba(0, 80, 92, 0.15)',
                    width: '100%'
                }}
            >
                <div style={{ padding: '24px 24px 20px 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <button
                                className="btn"
                                onClick={() => navigate(-1)}
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
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{
                                fontFamily: atisaStyles.fonts.primary,
                                fontWeight: 'bold',
                                color: 'white',
                                margin: 0,
                                fontSize: '1.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px'
                            }}>
                                <i className="bi bi-check-all"></i>
                                Cumplimiento Masivo de Hitos
                            </h2>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                className="btn"
                                onClick={() => setShowFilters(true)}
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '8px',
                                    fontFamily: atisaStyles.fonts.secondary,
                                    fontWeight: '600',
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                                }}
                            >
                                <i className="bi bi-funnel-fill" style={{ color: 'white' }}></i>
                                Filtros
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setShowCumplimentarModal(true)}
                                disabled={selectedIds.length === 0}
                                style={{
                                    backgroundColor: selectedIds.length === 0 ? 'rgba(255, 255, 255, 0.2)' : atisaStyles.colors.secondary,
                                    color: 'white',
                                    border: selectedIds.length === 0 ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                                    borderRadius: '8px',
                                    fontFamily: atisaStyles.fonts.secondary,
                                    fontWeight: '600',
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s ease',
                                    opacity: selectedIds.length === 0 ? 0.7 : 1,
                                    cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer'
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
                                <i className="bi bi-file-earmark-check" style={{ color: 'white' }}></i>
                                Cumplimentar {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="container-fluid p-4">
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body">


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
                                Seleccionados: {selectedIds.length} / Filtrados: {filteredItems.length}
                            </span>
                            <div className="d-flex gap-2">
                                {filteredItems.length > 0 && selectedIds.length < filteredItems.length && (
                                    <button
                                        type="button"
                                        className="btn btn-sm"
                                        onClick={() => onSelectAllVisible(true)}
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
                                        Todos (Filtrados)
                                    </button>
                                )}
                                {selectedIds.length > 0 && (
                                    <button
                                        type="button"
                                        className="btn btn-sm"
                                        onClick={() => onSelectAllVisible(false)}
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
                                        Limpiar Selección
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="table-responsive">
                            <table className="table table-hover"
                                style={{ fontFamily: atisaStyles.fonts.secondary, margin: 0 }}
                            >
                                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                                    <tr
                                        style={{
                                            backgroundColor: atisaStyles.colors.light,
                                            color: atisaStyles.colors.primary,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                        }}
                                    >
                                        <th style={{ width: '50px', padding: '16px 12px', borderBottom: `3px solid ${atisaStyles.colors.primary}`, backgroundColor: atisaStyles.colors.light }}>
                                            <div className="form-check form-check-sm form-check-custom form-check-solid">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={areAllVisibleSelected}
                                                    onChange={(e) => onSelectAllVisible(e.target.checked)}
                                                    disabled={filteredItems.length === 0}
                                                    style={{
                                                        borderColor: atisaStyles.colors.primary,
                                                        backgroundColor: areAllVisibleSelected ? atisaStyles.colors.secondary : 'transparent'
                                                    }}
                                                />
                                            </div>
                                        </th>
                                        {isAdmin && (
                                            <th className="cursor-pointer user-select-none" onClick={() => handleSort('cliente')} style={tableHeaderStyle}>
                                                Cliente {getSortIcon('cliente')}
                                            </th>
                                        )}
                                        <th className="cursor-pointer user-select-none" onClick={() => handleSort('cubo')} style={tableHeaderStyle}>
                                            Cubo {getSortIcon('cubo')}
                                        </th>
                                        <th className="cursor-pointer user-select-none" onClick={() => handleSort('proceso')} style={tableHeaderStyle}>
                                            Proceso {getSortIcon('proceso')}
                                        </th>
                                        <th className="cursor-pointer user-select-none" onClick={() => handleSort('hito')} style={tableHeaderStyle}>
                                            Hito {getSortIcon('hito')}
                                        </th>
                                        <th className="cursor-pointer user-select-none" onClick={() => handleSort('responsable')} style={tableHeaderStyle}>
                                            Responsable {getSortIcon('responsable')}
                                        </th>
                                        <th className="cursor-pointer user-select-none" onClick={() => handleSort('clave')} style={tableHeaderStyle}>
                                            Clave {getSortIcon('clave')}
                                        </th>
                                        <th className="cursor-pointer user-select-none" onClick={() => handleSort('estado')} style={tableHeaderStyle}>
                                            Estado {getSortIcon('estado')}
                                        </th>
                                        <th className="cursor-pointer user-select-none" onClick={() => handleSort('fecha_limite')} style={tableHeaderStyle}>
                                            Fecha / Hora Límite {getSortIcon('fecha_limite')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: '40px 20px', color: atisaStyles.colors.dark, fontFamily: atisaStyles.fonts.secondary }}>
                                                <i className="bi bi-inbox" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}></i>
                                                {loading ? 'Cargando datos...' : 'No se encontraron registros'}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedItems.map((item, index) => {
                                            const isSelected = selectedIds.includes(item.id)
                                            const isFinalized = item.estado === 'Finalizado'
                                            const isNuevo = item.estado === 'Nuevo'
                                            const estadoVenc = getEstadoVencimiento(item.fecha_limite, item.estado)
                                            const finalizadoFuera = isFinalizadoFueraDePlazo(item)
                                            const venceHoy = isNuevo && estadoVenc === 'hoy'

                                            let badgeColors = { bg: '#f5f5f5', color: '#616161', border: '#e0e0e0' }
                                            let estadoTexto = isFinalized ? 'Cumplido' : 'Pendiente'

                                            if (isFinalized) {
                                                if (finalizadoFuera) {
                                                    badgeColors = { bg: '#fff3e0', color: '#ef6c00', border: '#ffe0b2' } // Naranja
                                                    estadoTexto = 'Cumplido fuera de plazo'
                                                } else {
                                                    badgeColors = { bg: '#e8f5e8', color: '#2e7d32', border: '#c8e6c9' } // Verde
                                                    estadoTexto = 'Cumplido en plazo'
                                                }
                                            } else {
                                                if (venceHoy) {
                                                    badgeColors = { bg: '#fff8e1', color: '#f9a825', border: '#ffecb3' } // Amarillo
                                                    estadoTexto = 'Vence hoy'
                                                } else if (estadoVenc === 'vencido') {
                                                    badgeColors = { bg: '#ffebee', color: '#c62828', border: '#ffcdd2' } // Rojo
                                                    estadoTexto = 'Pendiente fuera de plazo'
                                                } else if (estadoVenc === 'sin_fecha') {
                                                    badgeColors = { bg: '#f5f5f5', color: '#616161', border: '#e0e0e0' }
                                                    estadoTexto = 'Sin fecha'
                                                } else {
                                                    badgeColors = { bg: '#e0f2f1', color: '#00695c', border: '#b2dfdb' } // Teal
                                                    estadoTexto = 'Pendiente en plazo'
                                                }
                                            }

                                            return (
                                                <tr
                                                    key={item.id}
                                                    style={{
                                                        backgroundColor: isSelected ? 'rgba(156, 186, 57, 0.15)' : (index % 2 === 0 ? 'white' : '#f8f9fa'),
                                                        transition: 'all 0.2s ease',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={(e) => {
                                                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                                                            onSelectRow(item.id)
                                                        }
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isSelected) {
                                                            e.currentTarget.style.backgroundColor = '#e9ecef'
                                                            e.currentTarget.style.transform = 'translateY(-1px)'
                                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 80, 92, 0.1)'
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isSelected) {
                                                            e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa'
                                                            e.currentTarget.style.transform = 'translateY(0)'
                                                            e.currentTarget.style.boxShadow = 'none'
                                                        }
                                                    }}
                                                >
                                                    <td style={{ ...tableCellStyleBase, width: '50px', borderBottom: `1px solid ${atisaStyles.colors.light}` }}>
                                                        <div className="form-check form-check-sm form-check-custom form-check-solid">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={selectedIds.includes(item.id)}
                                                                onChange={(e) => onSelectRow(item.id)}
                                                            />
                                                        </div>
                                                    </td>
                                                    {isAdmin && (
                                                        <td style={{ ...tableCellStyleBase, color: isSelected ? atisaStyles.colors.secondary : atisaStyles.colors.primary, fontWeight: '600', borderBottom: `1px solid ${atisaStyles.colors.light}` }}>{item.cliente_nombre}</td>
                                                    )}
                                                    <td style={{ ...tableCellStyleBase, color: atisaStyles.colors.dark, borderBottom: `1px solid ${atisaStyles.colors.light}` }}>
                                                        {item.codSubDepar && item.codSubDepar.length > 4 ? (
                                                            `${item.codSubDepar.substring(4)} - ${item.departamento_cliente || item.departamento || '-'}`
                                                        ) : item.codSubDepar ? (
                                                            `${item.codSubDepar} - ${item.departamento_cliente || item.departamento || '-'}`
                                                        ) : (
                                                            item.departamento_cliente || item.departamento || '-'
                                                        )}
                                                    </td>
                                                    <td style={{ ...tableCellStyleBase, color: atisaStyles.colors.dark, borderBottom: `1px solid ${atisaStyles.colors.light}` }}>{item.proceso_nombre}</td>
                                                    <td style={{ ...tableCellStyleBase, color: atisaStyles.colors.dark, borderBottom: `1px solid ${atisaStyles.colors.light}` }}>{item.hito_nombre}</td>
                                                    <td style={{ ...tableCellStyleBase, borderBottom: `1px solid ${atisaStyles.colors.light}` }}>{renderResponsable(item.tipo)}</td>
                                                    <td style={{ ...tableCellStyleBase, borderBottom: `1px solid ${atisaStyles.colors.light}` }}>{renderClave(item.critico)}</td>
                                                    <td style={{ ...tableCellStyleBase, borderBottom: `1px solid ${atisaStyles.colors.light}` }}>
                                                        <span
                                                            className="badge"
                                                            style={{
                                                                backgroundColor: badgeColors.bg,
                                                                color: badgeColors.color,
                                                                border: `1px solid ${badgeColors.border}`,
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                padding: '6px 10px',
                                                                borderRadius: '6px'
                                                            }}
                                                        >
                                                            {estadoTexto}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...tableCellStyleBase, color: atisaStyles.colors.dark, borderBottom: `1px solid ${atisaStyles.colors.light}` }}>
                                                        {item.fecha_limite} {item.hora_limite ? (item.hora_limite.length > 5 ? item.hora_limite.slice(0, 5) : item.hora_limite) : ''}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {filteredItems.length > 0 && (
                            <div style={{
                                backgroundColor: '#f8f9fa',
                                padding: '16px 20px',
                                borderRadius: '8px',
                                marginTop: '20px'
                            }}>
                                <SharedPagination
                                    currentPage={page}
                                    totalItems={filteredItems.length}
                                    pageSize={limit}
                                    onPageChange={setPage}
                                />
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Modal de cumplimiento (mantenido como modal interno) */}
            {showCumplimentarModal && (
                <CumplimentarHitosMasivoModal
                    show={showCumplimentarModal}
                    onHide={() => setShowCumplimentarModal(false)}
                    ids={selectedIds}
                    onSuccess={handleMassSuccess}
                />
            )}
            {/* Drawer de Filtros */}
            {showFilters && (
                <div
                    onClick={() => setShowFilters(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'transparent',
                        zIndex: 1040,
                        transition: 'opacity 0.3s'
                    }}
                />
            )}

            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: showFilters ? 0 : '-400px',
                    width: '400px',
                    height: '100vh',
                    background: 'linear-gradient(160deg, #00505c 0%, #007b8a 100%)',
                    boxShadow: showFilters ? '-8px 0 40px rgba(0,0,0,0.25)' : 'none',
                    zIndex: 1050,
                    transition: 'right 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto'
                }}
            >
                {/* Cabecera del drawer */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="bi bi-funnel-fill" style={{ color: 'white', fontSize: '18px' }}></i>
                        <span style={{ color: 'white', fontFamily: atisaStyles.fonts.primary, fontWeight: '700', fontSize: '1.2rem' }}>Filtros</span>
                    </div>
                    <button
                        onClick={() => setShowFilters(false)}
                        style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '8px',
                            color: 'white',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '18px',
                            transition: 'background 0.2s'
                        }}
                    >
                        <i className="bi bi-x"></i>
                    </button>
                </div>

                {/* Contenido del drawer */}
                <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Búsqueda */}
                    <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', display: 'block' }}>Búsqueda</label>
                        <div style={{ position: 'relative' }}>
                            <i className="bi bi-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }}></i>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Proceso, hito..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '36px', backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: '8px' }}
                            />
                        </div>
                    </div>

                    {/* Cliente */}
                    {isAdmin && (
                        <div>
                            <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', display: 'block' }}>Cliente</label>
                            <select
                                className="form-select form-select-sm"
                                value={selectedClienteId}
                                onChange={(e) => {
                                    setSelectedClienteId(e.target.value)
                                    setPage(1)
                                }}
                                style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: '8px' }}
                            >
                                <option value="" style={{ color: 'black' }}>Todos los clientes</option>
                                {clientesOpts.map((c) => (
                                    <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Fechas */}
                    <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', display: 'block' }}>Rango de Fechas (Límite)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', marginBottom: '4px', display: 'block' }}>Desde</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={fechaDesde}
                                    onChange={(e) => setFechaDesde(e.target.value)}
                                    style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: '8px' }}
                                />
                            </div>
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', marginBottom: '4px', display: 'block' }}>Hasta</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={fechaHasta}
                                    onChange={(e) => setFechaHasta(e.target.value)}
                                    style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: '8px' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Proceso */}
                    <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', display: 'block' }}>Procesos</label>
                        <Select
                            isMulti
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            components={{ Option: CheckboxOption }}
                            options={procesosOpts}
                            value={selectedProcesos}
                            onChange={(newValue) => {
                                setSelectedProcesos(newValue as { value: number; label: string }[])
                                setPage(1)
                            }}
                            placeholder="Seleccionar procesos..."
                            menuPortalTarget={document.body}
                            styles={{
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                control: (base) => ({
                                    ...base,
                                    backgroundColor: 'rgba(255,255,255,0.12)',
                                    borderColor: 'rgba(255,255,255,0.25)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    minHeight: '38px'
                                }),
                                menu: (base) => ({ ...base, backgroundColor: 'white', zIndex: 9999 }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused ? atisaStyles.colors.light : 'white',
                                    color: atisaStyles.colors.dark,
                                    cursor: 'pointer',
                                    ':active': { backgroundColor: atisaStyles.colors.secondary }
                                }),
                                multiValue: (base) => ({ ...base, backgroundColor: atisaStyles.colors.secondary, borderRadius: '4px' }),
                                multiValueLabel: (base) => ({ ...base, color: 'white', fontSize: '12px' }),
                                multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#d32f2f', color: 'white' } }),
                                placeholder: (base) => ({ ...base, color: 'rgba(255,255,255,0.6)', fontSize: '13px' }),
                                input: (base) => ({ ...base, color: 'white' }),
                                singleValue: (base) => ({ ...base, color: 'white' }),
                            }}
                        />
                    </div>

                    {/* Hito */}
                    <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', display: 'block' }}>Hitos</label>
                        <Select
                            isMulti
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            components={{ Option: CheckboxOption }}
                            options={hitosOpts}
                            value={selectedHitos}
                            onChange={(newValue) => {
                                setSelectedHitos(newValue as { value: number; label: string }[])
                                setPage(1)
                            }}
                            placeholder="Seleccionar hitos..."
                            menuPortalTarget={document.body}
                            styles={{
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                control: (base) => ({
                                    ...base,
                                    backgroundColor: 'rgba(255,255,255,0.12)',
                                    borderColor: 'rgba(255,255,255,0.25)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    minHeight: '38px'
                                }),
                                menu: (base) => ({ ...base, backgroundColor: 'white', zIndex: 9999 }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused ? atisaStyles.colors.light : 'white',
                                    color: atisaStyles.colors.dark,
                                    cursor: 'pointer',
                                    ':active': { backgroundColor: atisaStyles.colors.secondary }
                                }),
                                multiValue: (base) => ({ ...base, backgroundColor: atisaStyles.colors.secondary, borderRadius: '4px' }),
                                multiValueLabel: (base) => ({ ...base, color: 'white', fontSize: '12px' }),
                                multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#d32f2f', color: 'white' } }),
                                placeholder: (base) => ({ ...base, color: 'rgba(255,255,255,0.6)', fontSize: '13px' }),
                                input: (base) => ({ ...base, color: 'white' }),
                                singleValue: (base) => ({ ...base, color: 'white' }),
                            }}
                        />
                    </div>

                    {/* Departamentos */}
                    <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', display: 'block' }}>Departamentos</label>
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
                                setPage(1)
                            }}
                            placeholder="Seleccionar departamentos..."
                            noOptionsMessage={() => "No hay opciones"}
                            menuPortalTarget={document.body}
                            styles={{
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                control: (base) => ({
                                    ...base,
                                    backgroundColor: 'rgba(255,255,255,0.12)',
                                    borderColor: 'rgba(255,255,255,0.25)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    minHeight: '38px'
                                }),
                                menu: (base) => ({ ...base, backgroundColor: 'white', zIndex: 9999 }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused ? atisaStyles.colors.light : 'white',
                                    color: atisaStyles.colors.dark,
                                    cursor: 'pointer',
                                    ':active': { backgroundColor: atisaStyles.colors.secondary }
                                }),
                                multiValue: (base) => ({ ...base, backgroundColor: atisaStyles.colors.secondary, borderRadius: '4px' }),
                                multiValueLabel: (base) => ({ ...base, color: 'white', fontSize: '12px' }),
                                multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#d32f2f', color: 'white' } }),
                                placeholder: (base) => ({ ...base, color: 'rgba(255,255,255,0.6)', fontSize: '13px' }),
                                input: (base) => ({ ...base, color: 'white' }),
                                singleValue: (base) => ({ ...base, color: 'white' }),
                            }}
                        />
                    </div>

                    {/* Clave */}
                    <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', display: 'block' }}>Importancia (Clave)</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            <div
                                onClick={() => { setFilterClave('todas'); setPage(1); }}
                                style={{
                                    cursor: 'pointer',
                                    backgroundColor: filterClave === 'todas' ? 'white' : 'rgba(255,255,255,0.1)',
                                    color: filterClave === 'todas' ? atisaStyles.colors.primary : 'white',
                                    border: '1px solid white',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Todas
                            </div>
                            <div
                                onClick={() => { setFilterClave('clave'); setPage(1); }}
                                style={{
                                    cursor: 'pointer',
                                    backgroundColor: filterClave === 'clave' ? '#ffc107' : 'rgba(255,255,255,0.1)',
                                    color: filterClave === 'clave' ? 'black' : 'white',
                                    border: '1px solid #ffc107',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Clave
                            </div>
                            <div
                                onClick={() => { setFilterClave('no_clave'); setPage(1); }}
                                style={{
                                    cursor: 'pointer',
                                    backgroundColor: filterClave === 'no_clave' ? '#50cd89' : 'rgba(255,255,255,0.1)',
                                    color: filterClave === 'no_clave' ? 'white' : 'white',
                                    border: '1px solid #50cd89',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                No Clave
                            </div>
                        </div>
                    </div>

                    {/* Responsable */}
                    <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', display: 'block' }}>Responsable</label>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {responsablesOpts.map((opt) => (
                                <div key={opt.value} className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`drawer-check-resp-${opt.value}`}
                                        checked={selectedResponsables.has(opt.value)}
                                        onChange={() => toggleResponsable(opt.value)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <label className="form-check-label" htmlFor={`drawer-check-resp-${opt.value}`} style={{ color: 'white', fontSize: '13px', cursor: 'pointer' }}>
                                        {opt.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer del drawer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex',
                    gap: '10px',
                    flexShrink: 0
                }}>
                    <button
                        className="btn btn-sm w-100"
                        onClick={handleResetFiltros}
                        style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)', fontWeight: '600' }}
                    >
                        <i className="bi bi-arrow-clockwise me-1"></i> Limpiar Filtros
                    </button>
                </div>
            </div>

        </div>
    )
}

export default CumplimientoMasivo
