import { FC, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Accordion } from 'react-bootstrap'
import { Cliente, getClienteById } from '../../../../api/clientes'
import { ClienteProceso, getClienteProcesosByCliente } from '../../../../api/clienteProcesos'
import { Proceso, getAllProcesos } from '../../../../api/procesos'
import { getClienteProcesoHitosByProceso, ClienteProcesoHito, updateClienteProcesoHito } from '../../../../api/clienteProcesoHitos'
import { Hito, getAllHitos } from '../../../../api/hitos'
import { createAuditoriaCalendario, AuditoriaCalendarioCreate } from '../../../../api/auditoriaCalendarios'
import HistorialAuditoriaModal from './HistorialAuditoriaModal'
import { atisaStyles } from '../../../../styles/atisaStyles'

interface Props {
  clienteId: string
}

interface HitoEditado {
  id: number
  fecha_inicio: string
  fecha_fin: string | null
  hora_limite: string | null
  observaciones?: string
}

const EditarCalendarioCliente: FC<Props> = ({ clienteId }) => {
  const navigate = useNavigate()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [procesos, setProcesos] = useState<ClienteProceso[]>([])
  const [procesosList, setProcesosList] = useState<Proceso[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [hitosPorProceso, setHitosPorProceso] = useState<Record<number, ClienteProcesoHito[]>>({})
  const [loadingHitos, setLoadingHitos] = useState(false)
  const [hitosMaestro, setHitosMaestro] = useState<Hito[]>([])
  const [hitosEditados, setHitosEditados] = useState<Record<number, HitoEditado>>({})
  const [cambiosRealizados, setCambiosRealizados] = useState<Array<{
    hitoId: number
    campo: string
    valorAnterior: string
    valorNuevo: string
    observaciones?: string
  }>>([])
  const [saving, setSaving] = useState(false)
  const [showHistorialAuditoria, setShowHistorialAuditoria] = useState(false)

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
      // Obtener el mes y año actual
      const ahora = new Date()
      const anoActual = ahora.getFullYear()
      const mesActual = (ahora.getMonth() + 1).toString().padStart(2, '0')
      const periodoActual = `${anoActual}-${mesActual}`

      // Buscar si existe el período actual en la lista
      const existePeriodoActual = periodos.includes(periodoActual)

      // Seleccionar el período actual si existe, sino el más reciente
      setSelectedPeriod(existePeriodoActual ? periodoActual : periodos[0])
    }
  }, [periodos])

  // Función para cargar todos los hitos de los procesos
  const cargarHitosDeProcesos = async (procesosACarga: ClienteProceso[]) => {
    if (procesosACarga.length === 0) {
      setHitosPorProceso({})
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

      // Organizar hitos por proceso y ordenar por fecha de inicio
      resultados.forEach(({ procesoId, hitos }) => {
        hitosMap[procesoId] = hitos.sort((a, b) =>
          new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
        )
      })

      setHitosPorProceso(hitosMap)

    } catch (error) {
      console.error('Error cargando hitos:', error)
      setHitosPorProceso({})
    }

    setLoadingHitos(false)
  }

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

  const formatDateForInput = (date: string) => {
    if (!date || date === '' || date === 'null' || date === 'undefined') {
      return ''
    }

    try {
      const d = new Date(date)
      // Verificar si la fecha es válida
      if (isNaN(d.getTime())) {
        return ''
      }
      return d.toISOString().split('T')[0]
    } catch (error) {
      console.warn('Error formateando fecha:', error)
      return ''
    }
  }

  const formatTimeForInput = (time: string | null) => {
    if (!time || time === 'null' || time === 'undefined' || time === '') {
      return ''
    }

    // Si ya está en formato HH:MM, devolverlo tal como está
    if (time.match(/^\d{2}:\d{2}$/)) {
      return time
    }

    // Si viene en otro formato, intentar parsearlo
    try {
      const date = new Date(`1970-01-01T${time}`)
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return ''
      }
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch {
      return ''
    }
  }

  const validarFechas = (fechaInicio: string | null, fechaFin: string | null) => {
    if (!fechaInicio) return true

    const inicio = new Date(fechaInicio)
    if (fechaFin) {
      const fin = new Date(fechaFin)
      return inicio <= fin
    }
    return true
  }

  const handleFechaChange = (hitoId: number, campo: 'fecha_inicio' | 'fecha_fin', valor: string) => {
    const hitoOriginal = Object.values(hitosPorProceso)
      .flat()
      .find(h => h.id === hitoId)

    if (!hitoOriginal) return

    const valorAnterior = campo === 'fecha_inicio' ? hitoOriginal.fecha_inicio : (hitoOriginal.fecha_fin || '')

    // Convertir valor vacío a null para fecha_fin
    const valorFinal = campo === 'fecha_fin' && valor === '' ? null : valor

    // Obtener las fechas actuales para validación
    const fechaInicioActual = campo === 'fecha_inicio' ? valorFinal : (hitosEditados[hitoId]?.fecha_inicio || hitoOriginal.fecha_inicio)
    const fechaFinActual = campo === 'fecha_fin' ? valorFinal : (hitosEditados[hitoId]?.fecha_fin || hitoOriginal.fecha_fin)

    // Validar que la fecha de inicio no sea posterior a la fecha fin
    if (!validarFechas(fechaInicioActual, fechaFinActual)) {
      alert('La fecha de inicio no puede ser posterior a la fecha límite')
      return
    }

    setHitosEditados(prev => ({
      ...prev,
      [hitoId]: {
        ...prev[hitoId],
        id: hitoId,
        fecha_inicio: prev[hitoId]?.fecha_inicio || hitoOriginal.fecha_inicio,
        fecha_fin: prev[hitoId]?.fecha_fin || hitoOriginal.fecha_fin,
        hora_limite: prev[hitoId]?.hora_limite || hitoOriginal.hora_limite,
        [campo]: valorFinal
      }
    }))

    // Registrar el cambio
    if (valorFinal !== valorAnterior) {
      const cambioExistente = cambiosRealizados.findIndex(c => c.hitoId === hitoId && c.campo === campo)
      const nuevoCambio = {
        hitoId,
        campo,
        valorAnterior,
        valorNuevo: valorFinal || ''
      }

      if (cambioExistente >= 0) {
        setCambiosRealizados(prev =>
          prev.map((c, index) => index === cambioExistente ? nuevoCambio : c)
        )
      } else {
        setCambiosRealizados(prev => [...prev, nuevoCambio])
      }
    }
  }


  const limpiarFechaFin = (hitoId: number) => {
    const hitoOriginal = Object.values(hitosPorProceso)
      .flat()
      .find(h => h.id === hitoId)

    if (!hitoOriginal) return

    const valorAnterior = hitoOriginal.fecha_fin || ''

    // Obtener las fechas actuales para validación
    const fechaInicioActual = hitosEditados[hitoId]?.fecha_inicio || hitoOriginal.fecha_inicio
    const fechaFinActual = null

    // Validar que la fecha de inicio no sea posterior a la fecha fin
    if (!validarFechas(fechaInicioActual, fechaFinActual)) {
      alert('La fecha de inicio no puede ser posterior a la fecha límite')
      return
    }

    setHitosEditados(prev => ({
      ...prev,
      [hitoId]: {
        ...prev[hitoId],
        id: hitoId,
        fecha_inicio: prev[hitoId]?.fecha_inicio || hitoOriginal.fecha_inicio,
        fecha_fin: null,
        hora_limite: prev[hitoId]?.hora_limite || hitoOriginal.hora_limite
      }
    }))

    // Registrar el cambio
    if (null !== valorAnterior) {
      const cambioExistente = cambiosRealizados.findIndex(c => c.hitoId === hitoId && c.campo === 'fecha_fin')
      const nuevoCambio = {
        hitoId,
        campo: 'fecha_fin' as const,
        valorAnterior,
        valorNuevo: ''
      }

      if (cambioExistente >= 0) {
        setCambiosRealizados(prev =>
          prev.map((c, index) => index === cambioExistente ? nuevoCambio : c)
        )
      } else {
        setCambiosRealizados(prev => [...prev, nuevoCambio])
      }

      // Registrar auditoría
      registrarAuditoria(hitoId, 'fecha_fin', valorAnterior, '')
    }
  }

  const handleHoraChange = (hitoId: number, valor: string) => {
    const hitoOriginal = Object.values(hitosPorProceso)
      .flat()
      .find(h => h.id === hitoId)

    if (!hitoOriginal) return

    const valorAnterior = hitoOriginal.hora_limite || ''

    setHitosEditados(prev => ({
      ...prev,
      [hitoId]: {
        ...prev[hitoId],
        id: hitoId,
        fecha_inicio: prev[hitoId]?.fecha_inicio || hitoOriginal.fecha_inicio,
        fecha_fin: prev[hitoId]?.fecha_fin || hitoOriginal.fecha_fin,
        hora_limite: valor
      }
    }))

    // Registrar el cambio
    if (valor !== valorAnterior) {
      const cambioExistente = cambiosRealizados.findIndex(c => c.hitoId === hitoId && c.campo === 'hora_limite')
      const nuevoCambio = {
        hitoId,
        campo: 'hora_limite',
        valorAnterior,
        valorNuevo: valor
      }

      if (cambioExistente >= 0) {
        setCambiosRealizados(prev =>
          prev.map((c, index) => index === cambioExistente ? nuevoCambio : c)
        )
      } else {
        setCambiosRealizados(prev => [...prev, nuevoCambio])
      }
    }
  }

  const handleObservacionesChange = (hitoId: number, observaciones: string) => {
    setHitosEditados(prev => ({
      ...prev,
      [hitoId]: {
        ...prev[hitoId],
        id: hitoId,
        fecha_inicio: prev[hitoId]?.fecha_inicio || '',
        fecha_fin: prev[hitoId]?.fecha_fin || null,
        hora_limite: prev[hitoId]?.hora_limite || null,
        observaciones
      }
    }))
  }

  const validarTodosLosCambios = () => {
    for (const [hitoId, hitoEditado] of Object.entries(hitosEditados)) {
      if (!validarFechas(hitoEditado.fecha_inicio, hitoEditado.fecha_fin)) {
        alert(`Error en el hito ${hitoId}: La fecha de inicio no puede ser posterior a la fecha límite`)
        return false
      }
    }
    return true
  }

  const registrarAuditoria = async (hitoId: number, campo: string, valorAnterior: string, valorNuevo: string, observaciones?: string) => {
    try {
      const auditoriaData: AuditoriaCalendarioCreate = {
        cliente_id: clienteId,
        hito_id: hitoId,
        campo_modificado: campo,
        valor_anterior: valorAnterior || null,
        valor_nuevo: valorNuevo || null,
        usuario_modificacion: 'Administrador', // TODO: Obtener del contexto de usuario
        observaciones: observaciones || null
      }

      await createAuditoriaCalendario(auditoriaData)
    } catch (error) {
      console.warn('Error registrando auditoría:', error)
      // No fallar el guardado por error de auditoría
    }
  }

  const guardarCambios = async () => {
    if (Object.keys(hitosEditados).length === 0) {
      alert('No hay cambios para guardar')
      return
    }

    // Validar todos los cambios antes de guardar
    if (!validarTodosLosCambios()) {
      return
    }

    const confirmacion = window.confirm(
      `¿Está seguro de que desea guardar los cambios en ${Object.keys(hitosEditados).length} hitos?\n\n` +
      'Esta acción registrará los cambios en el historial de auditoría.'
    )

    if (!confirmacion) return

    setSaving(true)
    try {
      // Guardar cambios en los hitos
      for (const [hitoId, hitoEditado] of Object.entries(hitosEditados)) {
        // Obtener el hito original para mantener su estado actual
        const hitoOriginal = Object.values(hitosPorProceso)
          .flat()
          .find(h => h.id === parseInt(hitoId))

        await updateClienteProcesoHito(parseInt(hitoId), {
          estado: hitoOriginal?.estado || 'Pendiente', // Mantener el estado actual del hito
          fecha_estado: new Date().toISOString(),
          fecha_inicio: hitoEditado.fecha_inicio,
          fecha_fin: hitoEditado.fecha_fin,
          hora_limite: hitoEditado.hora_limite
        })
      }

      // Registrar auditoría para cada cambio
      for (const cambio of cambiosRealizados) {
        await registrarAuditoria(
          cambio.hitoId,
          cambio.campo,
          cambio.valorAnterior,
          cambio.valorNuevo,
          hitosEditados[cambio.hitoId]?.observaciones
        )
      }

      alert(`Cambios guardados correctamente en ${Object.keys(hitosEditados).length} hitos\n\nSe han registrado ${cambiosRealizados.length} cambios en el historial de auditoría.`)

      // Recargar los hitos
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

      // Limpiar cambios
      setHitosEditados({})
      setCambiosRealizados([])
    } catch (error) {
      console.error('Error guardando cambios:', error)
      alert('Error al guardar los cambios. Por favor, inténtelo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const cancelarCambios = () => {
    const confirmacion = window.confirm('¿Está seguro de que desea cancelar todos los cambios? Se perderán las modificaciones no guardadas.')
    if (confirmacion) {
      setHitosEditados({})
      setCambiosRealizados([])
    }
  }

  const mostrarResumenCambios = () => {
    if (cambiosRealizados.length === 0) return

    const resumen = cambiosRealizados.map(cambio => {
      const hito = Object.values(hitosPorProceso).flat().find(h => h.id === cambio.hitoId)
      const nombreHito = hito ? getNombreHito(hito.hito_id) : `Hito ${cambio.hitoId}`

      return `• ${nombreHito}: ${cambio.campo} (${cambio.valorAnterior} → ${cambio.valorNuevo})`
    }).join('\n')

    alert(`Resumen de cambios:\n\n${resumen}`)
  }

  const getValorHito = (hito: ClienteProcesoHito, campo: 'fecha_inicio' | 'fecha_fin' | 'hora_limite') => {
    const hitoEditado = hitosEditados[hito.id]
    if (hitoEditado && hitoEditado[campo] !== undefined) {
      return hitoEditado[campo] || ''
    }

    const valorOriginal = campo === 'fecha_inicio' ? hito.fecha_inicio :
                         campo === 'fecha_fin' ? hito.fecha_fin :
                         hito.hora_limite

    // Manejar valores nulos, undefined o vacíos
    if (!valorOriginal || valorOriginal === 'null' || valorOriginal === 'undefined') {
      return ''
    }

    return valorOriginal
  }

  return (
    <div
      className="container py-5"
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
          position: 'relative'
        }}
      >
        {/* Botón de volver */}
        <button
          className="btn"
          onClick={() => navigate('/clientes')}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
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
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <i className="bi bi-arrow-left" style={{ color: 'white' }}></i>
          Volver
        </button>

        {/* Título principal */}
        <div className="text-center">
          <h2
            style={{
              fontFamily: atisaStyles.fonts.primary,
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              fontSize: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <i className="bi bi-pencil-square" style={{ color: 'white' }}></i>
            Editar Calendario - {cliente?.razsoc || clienteId}
          </h2>
        <p
          style={{
            margin: '8px 0 0 0',
            fontSize: '1.1rem',
            opacity: 0.9
          }}
        >
          Modifica las fechas de los hitos según sea necesario
        </p>
        </div>
      </div>

      {/* Barra de acciones */}
      <div
        className="mb-4 d-flex justify-content-between align-items-center"
        style={{
          backgroundColor: 'white',
          padding: '20px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
          border: `1px solid ${atisaStyles.colors.light}`
        }}
      >
        <div className="d-flex gap-3">

          <button
            className="btn"
            onClick={() => setShowHistorialAuditoria(true)}
            style={{
              backgroundColor: atisaStyles.colors.accent,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontFamily: atisaStyles.fonts.secondary,
              fontWeight: '600',
              padding: '8px 16px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
            }}
          >
            <i className="bi bi-clock-history me-2" style={{ color: 'white' }}></i>
            Ver Historial
          </button>

          {Object.keys(hitosEditados).length > 0 && (
            <div className="d-flex gap-2">
              <button
                className="btn"
                onClick={mostrarResumenCambios}
                style={{
                  backgroundColor: atisaStyles.colors.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontWeight: '600',
                  padding: '8px 16px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                }}
              >
                <i className="bi bi-list-ul me-2" style={{ color: 'white' }}></i>
                Ver Resumen
              </button>

              <button
                className="btn"
                onClick={cancelarCambios}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontWeight: '600',
                  padding: '8px 16px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#c82333'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc3545'
                }}
              >
                <i className="bi bi-x-circle me-2" style={{ color: 'white' }}></i>
                Cancelar
              </button>

              <button
                className="btn"
                onClick={guardarCambios}
                disabled={saving}
                style={{
                  backgroundColor: atisaStyles.colors.secondary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontWeight: '600',
                  padding: '8px 16px',
                  transition: 'all 0.3s ease',
                  opacity: saving ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                  }
                }}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2" style={{ color: 'white' }}></i>
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="d-flex align-items-center gap-3">
          {Object.keys(hitosEditados).length > 0 && (
            <div className="text-warning">
              <small>
                <i className="bi bi-exclamation-triangle me-1" style={{ color: '#ffc107' }}></i>
                <strong>{Object.keys(hitosEditados).length}</strong> hitos modificados
              </small>
            </div>
          )}
          {cambiosRealizados.length > 0 && (
            <div className="text-info">
              <small>
                <i className="bi bi-list-check me-1" style={{ color: atisaStyles.colors.accent }}></i>
                <strong>{cambiosRealizados.length}</strong> cambios pendientes
              </small>
            </div>
          )}
        </div>
      </div>

      {/* Selector de períodos */}
      <div
        className="mb-4 position-relative"
        style={{
          backgroundColor: 'white',
          padding: '20px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
          border: `1px solid ${atisaStyles.colors.light}`
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

      <Accordion
        defaultActiveKey="0"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
          border: `1px solid ${atisaStyles.colors.light}`,
          overflow: 'hidden'
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
                        className='table align-middle gs-0 gy-4 mb-0'
                        style={{
                          fontFamily: atisaStyles.fonts.secondary,
                          margin: 0
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              backgroundColor: atisaStyles.colors.primary,
                              color: 'white'
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
                              Fecha Inicio
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
                              Observaciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingHitos ? (
                            <tr>
                              <td
                                colSpan={6}
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
                              const hitosDelProceso = hitosPorProceso[proceso.id] || []

                              if (hitosDelProceso.length === 0) {
                                return (
                                  <tr
                                    key={proceso.id}
                                    style={{
                                      backgroundColor: '#f8f9fa'
                                    }}
                                  >
                                    <td
                                      colSpan={6}
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
                                const hasChanges = hitosEditados[hito.id] !== undefined

                                return (
                                  <tr
                                    key={`${proceso.id}-${hito.id}`}
                                    style={{
                                      backgroundColor: hasChanges ? '#fff3cd' : (hitoIndex % 2 === 0 ? 'white' : '#f8f9fa'),
                                      transition: 'all 0.2s ease',
                                      borderLeft: hasChanges ? `4px solid ${atisaStyles.colors.warning}` : 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = hasChanges ? '#ffeaa7' : atisaStyles.colors.light
                                      e.currentTarget.style.transform = 'translateY(-1px)'
                                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 80, 92, 0.1)'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = hasChanges ? '#fff3cd' : (hitoIndex % 2 === 0 ? 'white' : '#f8f9fa')
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
                                      {getNombreHito(hito.hito_id)}
                                      {hasChanges && (
                                        <i className="bi bi-pencil-square ms-2" style={{ color: '#ffc107' }}></i>
                                      )}
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                      <span
                                        style={{
                                          backgroundColor: isFinalized ? atisaStyles.colors.secondary : atisaStyles.colors.accent,
                                          color: 'white',
                                          padding: '6px 12px',
                                          borderRadius: '20px',
                                          fontSize: '12px',
                                          fontWeight: '600',
                                          fontFamily: atisaStyles.fonts.secondary
                                        }}
                                      >
                                        {hito.estado}
                                      </span>
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                      <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={formatDateForInput(getValorHito(hito, 'fecha_inicio'))}
                                        onChange={(e) => handleFechaChange(hito.id, 'fecha_inicio', e.target.value)}
                                        disabled={isFinalized}
                                        style={{
                                          fontFamily: atisaStyles.fonts.secondary,
                                          fontSize: '13px',
                                          border: hasChanges ? `2px solid ${atisaStyles.colors.warning}` : `1px solid ${atisaStyles.colors.light}`,
                                          borderRadius: '6px'
                                        }}
                                      />
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input
                                          type="date"
                                          className="form-control form-control-sm"
                                          value={formatDateForInput(getValorHito(hito, 'fecha_fin'))}
                                          onChange={(e) => handleFechaChange(hito.id, 'fecha_fin', e.target.value)}
                                          disabled={isFinalized}
                                          style={{
                                            fontFamily: atisaStyles.fonts.secondary,
                                            fontSize: '13px',
                                            border: hasChanges ? `2px solid ${atisaStyles.colors.warning}` : `1px solid ${atisaStyles.colors.light}`,
                                            borderRadius: '6px',
                                            flex: 1
                                          }}
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-sm"
                                          onClick={() => limpiarFechaFin(hito.id)}
                                          disabled={isFinalized}
                                          style={{
                                            backgroundColor: atisaStyles.colors.secondary,
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '6px 8px',
                                            fontSize: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: '32px',
                                            height: '32px',
                                            transition: 'all 0.2s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            if (!isFinalized) {
                                              e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                                              e.currentTarget.style.transform = 'scale(1.05)'
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (!isFinalized) {
                                              e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                                              e.currentTarget.style.transform = 'scale(1)'
                                            }
                                          }}
                                          title="Limpiar fecha límite"
                                        >
                                          <i className="bi bi-x-circle" style={{ fontSize: '14px', color: 'white' }}></i>
                                        </button>
                                      </div>
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                      <input
                                        type="time"
                                        className="form-control form-control-sm"
                                        value={formatTimeForInput(getValorHito(hito, 'hora_limite'))}
                                        onChange={(e) => handleHoraChange(hito.id, e.target.value)}
                                        disabled={isFinalized}
                                        style={{
                                          fontFamily: atisaStyles.fonts.secondary,
                                          fontSize: '13px',
                                          border: hasChanges ? `2px solid ${atisaStyles.colors.warning}` : `1px solid ${atisaStyles.colors.light}`,
                                          borderRadius: '6px'
                                        }}
                                      />
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                      <textarea
                                        className="form-control form-control-sm"
                                        value={hitosEditados[hito.id]?.observaciones || ''}
                                        onChange={(e) => handleObservacionesChange(hito.id, e.target.value)}
                                        placeholder="Observaciones del cambio..."
                                        disabled={isFinalized}
                                        rows={2}
                                        style={{
                                          fontFamily: atisaStyles.fonts.secondary,
                                          fontSize: '13px',
                                          border: hasChanges ? `2px solid ${atisaStyles.colors.warning}` : `1px solid ${atisaStyles.colors.light}`,
                                          borderRadius: '6px',
                                          resize: 'vertical'
                                        }}
                                      />
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

      {/* Modal de Historial de Auditoría */}
      <HistorialAuditoriaModal
        show={showHistorialAuditoria}
        onHide={() => setShowHistorialAuditoria(false)}
        clienteId={clienteId}
      />
    </div>
  )
}

export default EditarCalendarioCliente
