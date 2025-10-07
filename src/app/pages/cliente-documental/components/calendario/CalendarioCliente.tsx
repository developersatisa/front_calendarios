import { FC, useEffect, useMemo, useState } from 'react'
import { Accordion } from 'react-bootstrap'
import { Cliente, getClienteById } from '../../../../api/clientes'
import { ClienteProceso, getClienteProcesosByCliente } from '../../../../api/clienteProcesos'
import { Proceso, getAllProcesos } from '../../../../api/procesos'
import { getClienteProcesoHitosByProceso, ClienteProcesoHito } from '../../../../api/clienteProcesoHitos'
import { Hito, getAllHitos } from '../../../../api/hitos'
import { getClienteProcesoHitoCumplimientosByHito, ClienteProcesoHitoCumplimiento } from '../../../../api/clienteProcesoHitoCumplimientos'
import CumplimentarHitoModal from './CumplimentarHitoModal'
import { atisaStyles } from '../../../../styles/atisaStyles'

interface Props {
  clienteId: string
}

const CalendarioCliente: FC<Props> = ({ clienteId }) => {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [procesos, setProcesos] = useState<ClienteProceso[]>([])
  const [procesosList, setProcesosList] = useState<Proceso[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [hitosPorProceso, setHitosPorProceso] = useState<Record<number, ClienteProcesoHito[]>>({})
  const [loadingHitos, setLoadingHitos] = useState(false)
  const [hitosMaestro, setHitosMaestro] = useState<Hito[]>([])
  const [showCumplimentarHito, setShowCumplimentarHito] = useState(false)
  const [hitoSeleccionado, setHitoSeleccionado] = useState<ClienteProcesoHito | null>(null)
  const [showObservacionModal, setShowObservacionModal] = useState(false)
  const [observacionSeleccionada, setObservacionSeleccionada] = useState('')
  const [cumplimientosPorHito, setCumplimientosPorHito] = useState<Record<number, ClienteProcesoHitoCumplimiento[]>>({})
  const [busquedaNombre, setBusquedaNombre] = useState('')
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('')
  const [filtroVencimiento, setFiltroVencimiento] = useState<'todos' | 'vencido' | 'hoy' | 'en_plazo' | 'sin_fecha' | 'vencer_hoy'>('todos')
  const [filtroCumplimiento, setFiltroCumplimiento] = useState<'todos' | 'cumplimentado' | 'no_cumplimentado'>('todos')

  useEffect(() => {
    getClienteById(clienteId).then(setCliente)
    getClienteProcesosByCliente(clienteId).then(res => setProcesos(res.clienteProcesos || []))
    getAllProcesos().then(res => setProcesosList(res.procesos || []))
    getAllHitos().then((res) => setHitosMaestro(res.hitos || []))
  }, [clienteId])

  // Obtener períodos únicos
  const periodos = useMemo(() => {
    const uniquePeriods = new Set<string>()
    procesos.forEach(proceso => {
      if (proceso.anio && proceso.mes) {
        uniquePeriods.add(`${proceso.anio}-${proceso.mes.toString().padStart(2, '0')}`)
      }
    })
    return Array.from(uniquePeriods)
      .sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number)
        const [yearB, monthB] = b.split('-').map(Number)
        if (yearA !== yearB) return yearB - yearA
        return monthA - monthB
      })
  }, [procesos])

  useEffect(() => {
    if (periodos.length > 0) {
      // Obtener el mes y año actual usando UTC
      const ahora = new Date()
      const anoActual = ahora.getUTCFullYear()
      const mesActual = (ahora.getUTCMonth() + 1).toString().padStart(2, '0')
      const periodoActual = `${anoActual}-${mesActual}`

      // Buscar si existe el período actual en la lista
      const existePeriodoActual = periodos.includes(periodoActual)

      // Seleccionar el período actual si existe, sino el más reciente
      setSelectedPeriod(existePeriodoActual ? periodoActual : periodos[0])
    }
  }, [periodos])
  // Debounce para búsqueda por nombre de hito
  useEffect(() => {
    const normalizeText = (text: string) =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    const id = setTimeout(() => setDebouncedBusqueda(normalizeText(busquedaNombre)), 300)
    return () => clearTimeout(id)
  }, [busquedaNombre])

  // Función para cargar todos los hitos de los procesos
  const cargarHitosDeProcesos = async (procesosACarga: ClienteProceso[]) => {
    if (procesosACarga.length === 0) {
      setHitosPorProceso({})
      setCumplimientosPorHito({})
      return
    }

    setLoadingHitos(true)
    const hitosMap: Record<number, ClienteProcesoHito[]> = {}

    try {
      // Cargar hitos para todos los procesos en paralelo
      const hitosPromises = procesosACarga.map(proceso =>
        getClienteProcesoHitosByProceso(proceso.id)
          .then(hitosData => ({ procesoId: proceso.id, hitos: hitosData }))
          .catch(() => ({ procesoId: proceso.id, hitos: [] }))
      )

      const resultados = await Promise.all(hitosPromises)

      // Organizar hitos por proceso y ordenar por fecha límite
      resultados.forEach(({ procesoId, hitos }) => {
        hitosMap[procesoId] = hitos.sort((a, b) =>
          new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime()
        )
      })

      // Establecer hitos inmediatamente para que la tabla se muestre
      setHitosPorProceso(hitosMap)

      // Cargar cumplimientos de forma asíncrona y no bloqueante
      cargarCumplimientosAsync(hitosMap)

    } catch (error) {
      console.error('Error cargando hitos:', error)
      setHitosPorProceso({})
      setCumplimientosPorHito({})
    }

    setLoadingHitos(false)
  }

  // Navegación de períodos eliminada a petición

  // Función separada para cargar cumplimientos de forma asíncrona
  const cargarCumplimientosAsync = async (hitosMap: Record<number, ClienteProcesoHito[]>) => {
    try {
      const cumplimientosMap: Record<number, ClienteProcesoHitoCumplimiento[]> = {}
      const todosLosHitos = Object.values(hitosMap).flat()

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

        // Organizar cumplimientos por hito (ya vienen ordenados de la API)
        resultadosCumplimientos.forEach(({ hitoId, cumplimientos }) => {
          cumplimientosMap[hitoId] = cumplimientos || []
        })

        setCumplimientosPorHito(cumplimientosMap)
      } else {
        setCumplimientosPorHito({})
      }
    } catch (error) {
      console.warn('Error cargando cumplimientos (no bloqueante):', error)
      // No limpiar cumplimientos existentes en caso de error
    }
  }
  // Memoizar texto de última fecha/hora de cumplimiento por hito
  const ultimaFechaCumplimientoFmt = useMemo(() => {
    const result: Record<number, string> = {}
    Object.entries(cumplimientosPorHito).forEach(([hitoIdStr, cumplimientos]) => {
      const hitoId = parseInt(hitoIdStr, 10)
      if (!cumplimientos || cumplimientos.length === 0) {
        result[hitoId] = '-'
        return
      }
      try {
        const ultimo = cumplimientos[0]
        if (!ultimo.fecha || !ultimo.hora) {
          result[hitoId] = '-'
          return
        }
        let hhmm = ultimo.hora
        if (hhmm.includes(':')) {
          const p = hhmm.split(':')
          hhmm = `${p[0]}:${p[1]}`
        }
        const fecha = new Date(`${ultimo.fecha}T${hhmm}:00`)
        if (isNaN(fecha.getTime())) {
          result[hitoId] = '-'
          return
        }
        result[hitoId] = fecha.toLocaleDateString('es-ES', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
      } catch {
        result[hitoId] = '-'
      }
    })
    return result
  }, [cumplimientosPorHito])

  // Agrupar procesos por tipo y subgrupar por período
  const groupedProcesos = useMemo(() => {
    const groups = procesos.reduce((acc, proceso) => {
      const procesoInfo = procesosList.find(p => p.id === proceso.proceso_id)
      const key = procesoInfo?.nombre || `Proceso ${proceso.proceso_id}`
      if (!acc[key]) {
        acc[key] = {
          items: [],
          periodos: {}
        }
      }
      acc[key].items.push(proceso)
      const mes = proceso.mes?.toString().padStart(2, '0')
      const periodoKey = `${proceso.anio}-${mes}`
      if (!acc[key].periodos[periodoKey]) {
        acc[key].periodos[periodoKey] = {
          anio: proceso.anio,
          mes: proceso.mes,
          items: []
        }
      }
      acc[key].periodos[periodoKey].items.push(proceso)
      return acc
    }, {} as Record<string, {
      items: ClienteProceso[],
      periodos: Record<string, {
        anio: number | null,
        mes: number | null,
        items: ClienteProceso[]
      }>
    }>)

    Object.keys(groups).forEach(key => {
      Object.values(groups[key].periodos).forEach(periodo => {
        periodo.items.sort((a, b) =>
          new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
        )
      })
      groups[key].periodos = Object.fromEntries(
        Object.entries(groups[key].periodos)
          .sort(([, a], [, b]) => {
            if (a.anio !== b.anio) return (b.anio || 0) - (a.anio || 0)
            return (a.mes || 0) - (b.mes || 0)
          })
      )
    })

    return groups
  }, [procesos, procesosList])

  // Cargar hitos cuando cambien los procesos filtrados por período
  useEffect(() => {
    if (selectedPeriod && Object.keys(groupedProcesos).length > 0) {
      const procesosVisibles: ClienteProceso[] = []
      Object.values(groupedProcesos).forEach(grupo => {
        const periodoData = grupo.periodos[selectedPeriod]
        if (periodoData) {
          procesosVisibles.push(...periodoData.items)
        }
      })
      cargarHitosDeProcesos(procesosVisibles)
    }
  }, [selectedPeriod, groupedProcesos])

  const getMesName = (mes: number) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return meses[mes - 1] || '-'
  }

  const getNombreHito = (hito_id: number) => {
    const hito = hitosMaestro.find(h => h.id === hito_id)
    return hito ? hito.nombre : `Hito ${hito_id}`
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateWithTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (time: string | null) => {
    if (!time) return '-'

    // Si ya está en formato HH:MM, devolverlo tal como está
    if (time.match(/^\d{2}:\d{2}$/)) {
      return time
    }

    // Si viene en otro formato, intentar parsearlo
    try {
      const date = new Date(`1970-01-01T${time}`)
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch {
      return time // Si no se puede parsear, devolver el valor original
    }
  }

  const getUltimaFechaCumplimiento = (hitoId: number) => {
    const cumplimientos = cumplimientosPorHito[hitoId]
    if (!cumplimientos || cumplimientos.length === 0) {
      return '-'
    }

    try {
      const ultimoCumplimiento = cumplimientos[0] // Ya están ordenados por fecha descendente

      // Validar que tenemos fecha y hora
      if (!ultimoCumplimiento.fecha || !ultimoCumplimiento.hora) {
        return '-'
      }

      // Manejar formato de hora HH:MM:SS o HH:MM
      let horaFormateada = ultimoCumplimiento.hora
      if (horaFormateada.includes(':')) {
        const partes = horaFormateada.split(':')
        horaFormateada = `${partes[0]}:${partes[1]}` // Solo tomar HH:MM
      }

      // Crear fecha completa y formatearla
      const fechaCompleta = `${ultimoCumplimiento.fecha}T${horaFormateada}:00`
      const fecha = new Date(fechaCompleta)

      // Verificar que la fecha es válida
      if (isNaN(fecha.getTime())) {
        return '-'
      }

      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.warn('Error formateando fecha de cumplimiento:', error)
      return '-'
    }
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

  // ¿Vence hoy en <= N horas? Ignora horas vacías o "00:00"
  const esUrgenteEnHoras = (fechaLimite?: string | null, horaLimite?: string | null, horas: number = 2) => {
    if (!fechaLimite || !horaLimite || horaLimite.startsWith('00:00')) return false
    try {
      const ahora = new Date()
      const hoyUTC = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()))
      const [y, m, d] = fechaLimite.split('-').map(Number)
      const fechaUTC = new Date(Date.UTC(y, m - 1, d))
      // Debe ser hoy
      if (fechaUTC.getTime() !== hoyUTC.getTime()) return false

      // Construir Date de vencimiento hoy con hora límite en local (mostrar urgencia relativa al usuario)
      const [hh, mm] = (horaLimite.includes(':') ? horaLimite : `${horaLimite}:00`).split(':').map(Number)
      const vencimiento = new Date()
      vencimiento.setHours(hh || 0, mm || 0, 0, 0)
      const diffMs = vencimiento.getTime() - Date.now()
      const limiteMs = horas * 60 * 60 * 1000
      return diffMs >= 0 && diffMs <= limiteMs
    } catch {
      return false
    }
  }
  // Predicados de filtros rápidos
  const coincideVencimiento = (h: ClienteProcesoHito) => {
    if (filtroVencimiento === 'todos') return true
    if (filtroVencimiento === 'vencer_hoy') {
      // Estado nuevo y vence hoy
      return h.estado === 'Nuevo' && getEstadoVencimiento(h.fecha_limite, h.estado) === 'hoy'
    }
    const ev = getEstadoVencimiento(h.fecha_limite, h.estado)
    return ev === filtroVencimiento
  }
  const coincideCumplimiento = (h: ClienteProcesoHito) => {
    if (filtroCumplimiento === 'todos') return true
    const tieneCumplimientos = (cumplimientosPorHito[h.id] && cumplimientosPorHito[h.id].length > 0)
    return filtroCumplimiento === 'cumplimentado' ? tieneCumplimientos : !tieneCumplimientos
  }

  // Determinar si fue finalizado fuera de plazo (último cumplimiento > fecha límite + hora límite)
  const getUltimoCumplimientoDate = (hitoId: number): Date | null => {
    const lista = cumplimientosPorHito[hitoId]
    if (!lista || lista.length === 0) return null
    const c = lista[0]
    if (!c.fecha) return null
    const horaStr = c.hora ? (c.hora.includes(':') ? c.hora : `${c.hora}:00`) : '00:00'
    const dt = new Date(`${c.fecha}T${horaStr.length === 5 ? horaStr + ':00' : horaStr}`)
    return isNaN(dt.getTime()) ? null : dt
  }

  const getFechaLimiteDate = (fechaLimite?: string | null, horaLimite?: string | null): Date | null => {
    if (!fechaLimite) return null
    const horaStr = horaLimite && !horaLimite.startsWith('00:00')
      ? (horaLimite.includes(':') ? horaLimite : `${horaLimite}:00`)
      : '23:59:59'
    const dt = new Date(`${fechaLimite}T${horaStr.length === 5 ? horaStr + ':00' : horaStr}`)
    return isNaN(dt.getTime()) ? null : dt
  }

  const isFinalizadoFueraDePlazo = (h: ClienteProcesoHito): boolean => {
    if (h.estado !== 'Finalizado') return false
    const ult = getUltimoCumplimientoDate(h.id)
    const limite = getFechaLimiteDate(h.fecha_limite, h.hora_limite)
    if (!ult || !limite) return false
    return ult.getTime() > limite.getTime()
  }

  // Recargar hitos después de subir documento
  const handleUploadSuccess = async () => {
    if (selectedPeriod && Object.keys(groupedProcesos).length > 0) {
      const procesosVisibles: ClienteProceso[] = []
      Object.values(groupedProcesos).forEach(grupo => {
        const periodoData = grupo.periodos[selectedPeriod]
        if (periodoData) {
          procesosVisibles.push(...periodoData.items)
        }
      })
      await cargarHitosDeProcesos(procesosVisibles)
    }
  }

  const handleMostrarObservacion = (observacion: string) => {
    setObservacionSeleccionada(observacion)
    setShowObservacionModal(true)
  }

  return (
    <div
      className="container-fluid py-5"
      style={{
        fontFamily: atisaStyles.fonts.secondary,
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
      }}
    >
      {/* Header del calendario */}
      <div
        style={{
          backgroundColor: atisaStyles.colors.primary,
          color: 'white',
          padding: '32px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.15)',
          marginBottom: '16px',
          textAlign: 'center',
          maxWidth: '1600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      >
        <h2
          style={{
            fontFamily: atisaStyles.fonts.primary,
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            fontSize: '2.5rem'
          }}
        >
          <i className="bi bi-calendar3 me-3" style={{ color: 'white' }}></i>
          Calendario de {cliente?.razsoc || clienteId}
        </h2>
      </div>


      {/* Selector de períodos */}
      <div
        className="mb-4 position-relative"
        style={{
          backgroundColor: 'white',
          padding: '20px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
          border: `1px solid ${atisaStyles.colors.light}`,
          maxWidth: '1600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      >
        <div className="d-flex overflow-auto justify-content-end" style={{ scrollbarWidth: 'thin' }}>
          {periodos.map((periodo) => {
            const [year, month] = periodo.split('-')
            const isSelected = selectedPeriod === periodo
            return (
              <button
                key={periodo}
                className="btn btn-sm"
                style={{
                  backgroundColor: isSelected ? atisaStyles.colors.secondary : 'white',
                  color: isSelected ? 'white' : atisaStyles.colors.primary,
                  border: `2px solid ${isSelected ? atisaStyles.colors.accent : atisaStyles.colors.light}`,
                  borderRadius: '8px',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontWeight: '600',
                  padding: '6px 12px',
                  fontSize: '13px',
                  transition: 'all 0.3s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(156, 186, 57, 0.3)' : '0 2px 8px rgba(0, 80, 92, 0.1)',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setSelectedPeriod(periodo)}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                    e.currentTarget.style.borderColor = atisaStyles.colors.accent
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.borderColor = atisaStyles.colors.light
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {getMesName(parseInt(month))} {year}
              </button>
            )
          })}
        </div>
      </div>

      {/* Barra de filtros y búsqueda sticky bajo el selector de períodos */}
      <div
        className="mb-3"
        style={{
          position: 'sticky',
          top: 8,
          zIndex: 2,
          backgroundColor: 'white',
          padding: '12px 16px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          border: `1px solid ${atisaStyles.colors.light}`,
          maxWidth: '1600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      >
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-sm" style={{ backgroundColor: filtroVencimiento === 'todos' ? atisaStyles.colors.secondary : 'white', color: filtroVencimiento === 'todos' ? 'white' : atisaStyles.colors.primary, border: `1px solid ${atisaStyles.colors.light}`, borderRadius: '20px', padding: '6px 12px', fontWeight: 600 }} onClick={() => setFiltroVencimiento('todos')}>Todos</button>
            <button className="btn btn-sm" style={{ backgroundColor: filtroVencimiento === 'vencido' ? '#ef4444' : 'white', color: filtroVencimiento === 'vencido' ? 'white' : atisaStyles.colors.primary, border: `1px solid ${atisaStyles.colors.light}`, borderRadius: '20px', padding: '6px 12px', fontWeight: 600 }} onClick={() => setFiltroVencimiento('vencido')}>Vencido</button>
            <button className="btn btn-sm" style={{ backgroundColor: filtroVencimiento === 'hoy' ? '#f59e0b' : 'white', color: filtroVencimiento === 'hoy' ? 'white' : atisaStyles.colors.primary, border: `1px solid ${atisaStyles.colors.light}`, borderRadius: '20px', padding: '6px 12px', fontWeight: 600 }} onClick={() => setFiltroVencimiento('hoy')}>Hoy</button>
            <button className="btn btn-sm" style={{ backgroundColor: filtroVencimiento === 'vencer_hoy' ? '#dc2626' : 'white', color: filtroVencimiento === 'vencer_hoy' ? 'white' : atisaStyles.colors.primary, border: `1px solid ${atisaStyles.colors.light}`, borderRadius: '20px', padding: '6px 12px', fontWeight: 600 }} onClick={() => setFiltroVencimiento('vencer_hoy')}>Vencer Hoy</button>
            <button className="btn btn-sm" style={{ backgroundColor: filtroVencimiento === 'en_plazo' ? '#10b981' : 'white', color: filtroVencimiento === 'en_plazo' ? 'white' : atisaStyles.colors.primary, border: `1px solid ${atisaStyles.colors.light}`, borderRadius: '20px', padding: '6px 12px', fontWeight: 600 }} onClick={() => setFiltroVencimiento('en_plazo')}>En plazo</button>
            {/* Botón 'Sin fecha' eliminado a petición */}

            <div className="vr mx-2" style={{ height: 24 }}></div>

            <button className="btn btn-sm" style={{ backgroundColor: filtroCumplimiento === 'todos' ? atisaStyles.colors.secondary : 'white', color: filtroCumplimiento === 'todos' ? 'white' : atisaStyles.colors.primary, border: `1px solid ${atisaStyles.colors.light}`, borderRadius: '20px', padding: '6px 12px', fontWeight: 600 }} onClick={() => setFiltroCumplimiento('todos')}>Todos</button>
            <button className="btn btn-sm" style={{ backgroundColor: filtroCumplimiento === 'cumplimentado' ? atisaStyles.colors.accent : 'white', color: filtroCumplimiento === 'cumplimentado' ? 'white' : atisaStyles.colors.primary, border: `1px solid ${atisaStyles.colors.light}`, borderRadius: '20px', padding: '6px 12px', fontWeight: 600 }} onClick={() => setFiltroCumplimiento('cumplimentado')}>Cumplimentados</button>
            <button className="btn btn-sm" style={{ backgroundColor: filtroCumplimiento === 'no_cumplimentado' ? '#adb5bd' : 'white', color: filtroCumplimiento === 'no_cumplimentado' ? 'white' : atisaStyles.colors.primary, border: `1px solid ${atisaStyles.colors.light}`, borderRadius: '20px', padding: '6px 12px', fontWeight: 600 }} onClick={() => setFiltroCumplimiento('no_cumplimentado')}>No cumplimentados</button>
          </div>

          <div style={{ minWidth: 260 }}>
            <input type="text" className="form-control form-control-sm" placeholder="Buscar por nombre de hito..." value={busquedaNombre} onChange={(e) => setBusquedaNombre(e.target.value)} style={{ fontFamily: atisaStyles.fonts.secondary, fontSize: '14px', border: `1px solid ${atisaStyles.colors.light}`, borderRadius: '6px' }} />
          </div>
        </div>
      </div>
      <Accordion
        defaultActiveKey="0"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
          border: `1px solid ${atisaStyles.colors.light}`,
          overflow: 'hidden',
          maxWidth: '1600px',
          margin: '0 auto'
        }}
      >
        {Object.entries(groupedProcesos).map(([nombreProceso, grupo], index) => {
          const procesosFiltradosPorPeriodo = selectedPeriod
            ? Object.entries(grupo.periodos).filter(([key]) => key === selectedPeriod)
            : Object.entries(grupo.periodos)
          if (procesosFiltradosPorPeriodo.length === 0) return null

          // Calcular total de hitos para este grupo de procesos
          const totalHitos = procesosFiltradosPorPeriodo.reduce((total, [, periodo]) => {
            return total + periodo.items.reduce((subtotal, proceso) => {
              const hitosDelProceso = hitosPorProceso[proceso.id] || []
              return subtotal + hitosDelProceso.length
            }, 0)
          }, 0)

          return (
            <Accordion.Item
              key={nombreProceso}
              eventKey={index.toString()}
              style={{
                border: 'none',
                borderBottom: `1px solid ${atisaStyles.colors.light}`
              }}
            >
              <Accordion.Header
                style={{
                  backgroundColor: atisaStyles.colors.light,
                  border: 'none',
                  padding: '20px 24px'
                }}
              >
                <div className='d-flex justify-content-between w-100 me-3'>
                  <span
                    style={{
                      fontFamily: atisaStyles.fonts.primary,
                      color: atisaStyles.colors.primary,
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}
                  >
                    <i className="bi bi-diagram-3 me-2" style={{ color: atisaStyles.colors.primary }}></i>
                    {nombreProceso}
                  </span>
                  <span
                    style={{
                      backgroundColor: atisaStyles.colors.secondary,
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      fontFamily: atisaStyles.fonts.secondary
                    }}
                  >
                    {totalHitos} hitos
                  </span>
                </div>
              </Accordion.Header>
              <Accordion.Body
                style={{
                  backgroundColor: 'white',
                  padding: '24px'
                }}
              >
                {procesosFiltradosPorPeriodo.map(([periodoKey, periodo]) => (
                  <div key={periodoKey} className='mb-5'>
                    <div
                      className='table-responsive'
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(0, 80, 92, 0.05)',
                        border: `1px solid ${atisaStyles.colors.light}`,
                        overflow: 'hidden'
                      }}
                    >
                      <table
                        className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4 mb-0'
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
                              Estado
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
                              Fecha Actualización
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
                              Fecha Límite
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
                              Hora Límite
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
                              Responsable
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
                              Fecha / Hora Cumplimiento
                            </th>
                            <th
                              className='text-start'
                              style={{
                                fontFamily: atisaStyles.fonts.primary,
                                fontWeight: 'bold',
                                fontSize: '14px',
                                padding: '16px 12px',
                                border: 'none',
                                color: 'white'
                              }}
                            >
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingHitos ? (
                            <tr>
                              <td
                                colSpan={9}
                                className="text-center py-4"
                                style={{
                                  backgroundColor: '#f8f9fa',
                                  fontFamily: atisaStyles.fonts.secondary
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
                          ) : (
                            periodo.items.map((proceso) => {
                              const hitosDelProceso = (hitosPorProceso[proceso.id] || [])
                                .filter((h) => coincideVencimiento(h) && coincideCumplimiento(h))
                                .filter((h) => {
                                  if (!debouncedBusqueda) return true
                                  const nombre = getNombreHito(h.hito_id)
                                    .toLowerCase()
                                    .normalize('NFD')
                                    .replace(/[\u0300-\u036f]/g, '')
                                  return nombre.includes(debouncedBusqueda)
                                })

                              if (hitosDelProceso.length === 0) {
                                return (
                                  <tr
                                    key={proceso.id}
                                    style={{
                                      backgroundColor: '#f8f9fa'
                                    }}
                                  >
                                    <td
                                      colSpan={8}
                                      className="text-center py-3"
                                      style={{
                                        color: atisaStyles.colors.dark,
                                        fontFamily: atisaStyles.fonts.secondary,
                                        padding: '16px 12px'
                                      }}
                                    >
                                      <i className="bi bi-info-circle me-2" style={{ color: atisaStyles.colors.dark }}></i>
                                      No hay hitos para este proceso
                                    </td>
                                  </tr>
                                )
                              }

                              return hitosDelProceso.map((hito, hitoIndex) => {
                                const isFinalized = hito.estado === 'Finalizado'
                                const isNuevo = hito.estado === 'Nuevo'
                                const estadoVenc = getEstadoVencimiento(hito.fecha_limite, hito.estado)
                                const finalizadoFuera = isFinalizadoFueraDePlazo(hito)
                                const venceHoy = isNuevo && estadoVenc === 'hoy'

                                // Color de fondo por vencimiento/finalización
                                const bgRow = isFinalized
                                  ? (finalizadoFuera
                                    ? '#fff3e0' // Finalizado fuera de plazo (naranja muy claro)
                                    : '#e6f4ea' // Finalizado en plazo (verde muy claro)
                                  )
                                  : (estadoVenc === 'vencido'
                                    ? '#ffe0e0'
                                    : venceHoy
                                      ? '#fef2f2' // Nuevo que vence hoy (rojo muy claro)
                                      : estadoVenc === 'hoy'
                                        ? '#fff0c2'
                                        : (hitoIndex % 2 === 0 ? 'white' : '#f8f9fa'))
                                // Sin barra lateral

                                return (
                                  <tr
                                    key={`${proceso.id}-${hito.id}`}
                                    style={{
                                      backgroundColor: bgRow,
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      const hoverColor = isFinalized
                                        ? (finalizadoFuera ? '#ffe6c7' : '#d1f0de')
                                        : (estadoVenc === 'vencido' ? '#ffcfcf' : (venceHoy ? '#fecaca' : (estadoVenc === 'hoy' ? '#ffe49a' : atisaStyles.colors.light)))
                                      e.currentTarget.style.backgroundColor = hoverColor
                                      e.currentTarget.style.transform = 'translateY(-1px)'
                                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 80, 92, 0.1)'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = bgRow
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
                                      <span title={getNombreHito(hito.hito_id)}>
                                        {getNombreHito(hito.hito_id)}
                                      </span>
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                      {isFinalized ? (
                                        finalizadoFuera ? (
                                          <span style={{ backgroundColor: '#b45309', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                            Cumplido fuera de plazo
                                          </span>
                                        ) : (
                                          <span style={{ backgroundColor: '#16a34a', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                            Cumplido en plazo
                                          </span>
                                        )
                                      ) : venceHoy ? (
                                        <span style={{ backgroundColor: '#dc2626', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                          Vence hoy
                                        </span>
                                      ) : (
                                        estadoVenc === 'vencido' ? (
                                          <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                            Pendiente fuera de plazo
                                          </span>
                                        ) : (
                                          <span style={{ backgroundColor: atisaStyles.colors.accent, color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: atisaStyles.fonts.secondary }}>
                                            Pendiente en plazo
                                          </span>
                                        )
                                      )}
                                    </td>
                                    <td
                                      style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        color: atisaStyles.colors.dark,
                                        padding: '16px 12px'
                                      }}
                                    >
                                      {hito.fecha_estado ? formatDateWithTime(hito.fecha_estado) : '-'}
                                    </td>

                                    <td
                                      style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        color: atisaStyles.colors.dark,
                                        padding: '16px 12px'
                                      }}
                                    >
                                      <span title={hito.fecha_limite || ''}>{hito.fecha_limite ? formatDate(hito.fecha_limite) : '-'}</span>
                                    </td>
                                    <td
                                      style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        color: atisaStyles.colors.dark,
                                        padding: '16px 12px'
                                      }}
                                    >
                                      <span title={hito.hora_limite || ''}>{hito.hora_limite ? formatTime(hito.hora_limite) : '-'}</span>
                                    </td>
                                    <td
                                      style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        color: atisaStyles.colors.dark,
                                        padding: '16px 12px'
                                      }}
                                    >
                                      {hito.tipo}
                                    </td>
                                    <td
                                      style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        color: atisaStyles.colors.dark,
                                        padding: '16px 12px'
                                      }}
                                    >
                                      <span title={ultimaFechaCumplimientoFmt[hito.id] || '-'}>
                                        {ultimaFechaCumplimientoFmt[hito.id] || '-'}
                                      </span>
                                    </td>
                                    <td
                                      className='text-start'
                                      style={{ padding: '16px 12px' }}
                                    >
                                      <button
                                        className="btn btn-sm"
                                        style={{
                                          backgroundColor: isFinalized ? '#6c757d' : atisaStyles.colors.secondary,
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '8px',
                                          fontFamily: atisaStyles.fonts.secondary,
                                          fontWeight: '600',
                                          padding: '8px 16px',
                                          fontSize: '12px',
                                          transition: 'all 0.3s ease',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px'
                                        }}
                                        onClick={() => {
                                          if (!isFinalized) {
                                            setHitoSeleccionado(hito)
                                            setShowCumplimentarHito(true)
                                          }
                                        }}
                                        disabled={isFinalized}
                                        title={isFinalized ? "Proceso finalizado - No se pueden subir documentos" : "Insertar documento"}
                                        onMouseEnter={(e) => {
                                          if (!isFinalized) {
                                            e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                                            e.currentTarget.style.transform = 'translateY(-2px)'
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!isFinalized) {
                                            e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                                            e.currentTarget.style.transform = 'translateY(0)'
                                          }
                                        }}
                                      >
                                        <i className="bi bi-upload" style={{ color: 'white' }}></i>
                                        {isFinalized ? 'Finalizado' : 'Cumplimentar'}
                                      </button>
                                    </td>
                                  </tr>
                                )
                              })
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </Accordion.Body>
            </Accordion.Item>
          )
        })}
      </Accordion>

      {/* Modal para subir documento */}
      {hitoSeleccionado && (
        <CumplimentarHitoModal
          show={showCumplimentarHito}
          onHide={() => setShowCumplimentarHito(false)}
          idClienteProcesoHito={hitoSeleccionado.id}
          nombreDocumento={getNombreHito(hitoSeleccionado.hito_id)}
          estado={hitoSeleccionado.estado}
          onUploadSuccess={() => {
            setShowCumplimentarHito(false)
            handleUploadSuccess()
          }}
        />
      )}
      {/* Modal para mostrar observación */}
      {showObservacionModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{
            background: 'rgba(0, 80, 92, 0.3)',
            zIndex: 9999
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content"
              style={{
                borderRadius: '12px',
                border: `2px solid ${atisaStyles.colors.light}`,
                boxShadow: '0 8px 30px rgba(0, 80, 92, 0.3)',
                fontFamily: atisaStyles.fonts.secondary
              }}
            >
              <div
                className="modal-header"
                style={{
                  backgroundColor: atisaStyles.colors.primary,
                  color: 'white',
                  borderRadius: '10px 10px 0 0',
                  border: 'none'
                }}
              >
                <h5
                  className="modal-title"
                  style={{
                    fontFamily: atisaStyles.fonts.primary,
                    fontWeight: 'bold',
                    margin: 0
                  }}
                >
                  <i className="bi bi-info-circle me-2" style={{ color: 'white' }}></i>
                  Observación
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowObservacionModal(false)}
                  style={{
                    filter: 'invert(1)'
                  }}
                ></button>
              </div>
              <div
                className="modal-body"
                style={{
                  padding: '24px',
                  backgroundColor: 'white'
                }}
              >
                <p
                  style={{
                    fontFamily: atisaStyles.fonts.secondary,
                    color: atisaStyles.colors.dark,
                    margin: 0,
                    lineHeight: '1.6'
                  }}
                >
                  {observacionSeleccionada}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarioCliente
