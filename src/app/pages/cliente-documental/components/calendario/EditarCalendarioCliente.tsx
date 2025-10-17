import { FC, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Accordion, Modal } from 'react-bootstrap'
import CustomToast from '../../../../components/ui/CustomToast'
import { Cliente, getClienteById } from '../../../../api/clientes'
import { ClienteProceso, getClienteProcesosByCliente, createClienteProceso, generarCalendarioClienteProceso, GenerarCalendarioParams } from '../../../../api/clienteProcesos'
import { Proceso, getAllProcesos } from '../../../../api/procesos'
import { getClienteProcesoHitosByProceso, getClienteProcesoHitosHabilitadosByProceso, ClienteProcesoHito, updateClienteProcesoHito, deshabilitarHitosPorHitoDesde } from '../../../../api/clienteProcesoHitos'
import { Hito, getAllHitos } from '../../../../api/hitos'
import { createAuditoriaCalendario, AuditoriaCalendarioCreate } from '../../../../api/auditoriaCalendarios'
import HistorialAuditoriaModal from './HistorialAuditoriaModal'
import { atisaStyles } from '../../../../styles/atisaStyles'

interface Props {
  clienteId: string
}

interface HitoEditado {
  id: number
  fecha_limite: string | null
  hora_limite: string | null
  observaciones?: string
}

interface EditForm {
  fecha_limite: string | null
  hora_limite: string | null
  observaciones: string
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
  const [observacionesGlobales, setObservacionesGlobales] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedHito, setSelectedHito] = useState<ClienteProcesoHito | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    fecha_limite: null,
    hora_limite: null,
    observaciones: ''
  })
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  // Estado eliminado: ya no se filtra por estado
  const [filtroProceso, setFiltroProceso] = useState('')
  const [busquedaNombre, setBusquedaNombre] = useState('')
  const [debouncedBusquedaNombre, setDebouncedBusquedaNombre] = useState('')
  const [searchingNombre, setSearchingNombre] = useState(false)
  const [vistaCalendario, setVistaCalendario] = useState(false)
  const [selectedHitosMaestro, setSelectedHitosMaestro] = useState<Set<number>>(new Set())
  const [selectedProcesos, setSelectedProcesos] = useState<Set<number>>(new Set())
  const [showDeshabilitarDesdeModal, setShowDeshabilitarDesdeModal] = useState(false)
  const [fechaDesdeDeshabilitar, setFechaDesdeDeshabilitar] = useState('')
  const [busquedaHitosModal, setBusquedaHitosModal] = useState('')
  const [busquedaProcesosModal, setBusquedaProcesosModal] = useState('')
  const [modoDeshabilitar, setModoDeshabilitar] = useState<'hitos' | 'procesos'>('hitos')
  const [showConfirmarHabilitarModal, setShowConfirmarHabilitarModal] = useState(false)
  const [hitoAConfirmar, setHitoAConfirmar] = useState<ClienteProcesoHito | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info')
  const [showCargarProcesosModal, setShowCargarProcesosModal] = useState(false)
  const [procesosDisponibles, setProcesosDisponibles] = useState<Proceso[]>([])
  const [procesosSeleccionados, setProcesosSeleccionados] = useState<Set<number>>(new Set())
  const [busquedaProcesos, setBusquedaProcesos] = useState('')
  const [fechaInicioProcesos, setFechaInicioProcesos] = useState('')
  const [filtroTemporalidad, setFiltroTemporalidad] = useState('')

  // Función auxiliar para verificar si un hito está habilitado
  const isHitoHabilitado = (hito: ClienteProcesoHito) => {
    return hito.habilitado === true || hito.habilitado === 1 || String(hito.habilitado) === '1'
  }

  // Función auxiliar para mostrar toasts
  const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  // Función para mostrar el modal de confirmación
  const toggleHabilitarHito = (hito: ClienteProcesoHito) => {
    setHitoAConfirmar(hito)
    setShowConfirmarHabilitarModal(true)
  }

  // Función para confirmar y ejecutar el cambio de estado
  const confirmarCambioEstado = async () => {
    if (!hitoAConfirmar) return

    try {
      const nuevoEstado = !isHitoHabilitado(hitoAConfirmar)

      // Crear objeto de actualización con solo los campos necesarios
      const hitoUpdate = {
        estado: hitoAConfirmar.estado,
        fecha_estado: hitoAConfirmar.fecha_estado,
        habilitado: nuevoEstado ? 1 : 0  // Enviar como número (1 o 0) en lugar de boolean
      }

      await updateClienteProcesoHito(hitoAConfirmar.id, hitoUpdate)

      // Actualizar el estado local
      setHitosPorProceso(prev => {
        const nuevo = { ...prev }
        Object.keys(nuevo).forEach(procesoId => {
          nuevo[parseInt(procesoId)] = nuevo[parseInt(procesoId)].map(h =>
            h.id === hitoAConfirmar.id ? { ...h, habilitado: nuevoEstado ? 1 : 0 } : h
          )
        })
        return nuevo
      })

      // Cerrar modal y limpiar estado
      setShowConfirmarHabilitarModal(false)
      setHitoAConfirmar(null)

      // Mostrar mensaje de confirmación
      const mensaje = nuevoEstado ? 'Hito habilitado correctamente' : 'Hito deshabilitado correctamente'
      showToastMessage(mensaje, 'success')

    } catch (error) {
      console.error('Error al actualizar el estado del hito:', error)

      // Mostrar información detallada del error
      let errorMessage = 'Error al actualizar el estado del hito'
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response
        if (response?.data?.detail) {
          errorMessage = `Error: ${response.data.detail}`
        } else if (response?.status) {
          errorMessage = `Error ${response.status}: ${response.statusText || 'Error del servidor'}`
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Error: ${(error as any).message}`
      }

      showToastMessage(errorMessage, 'error')
    }
  }

  // Función para cancelar el cambio
  const cancelarCambioEstado = () => {
    setShowConfirmarHabilitarModal(false)
    setHitoAConfirmar(null)
  }

  // Funciones para el modal de cargar procesos
  const abrirModalCargarProcesos = () => {
    setShowCargarProcesosModal(true)
    setProcesosSeleccionados(new Set())
    setBusquedaProcesos('')
    setFechaInicioProcesos(new Date().toISOString().split('T')[0])
    setFiltroTemporalidad('')
  }

  const cerrarModalCargarProcesos = () => {
    setShowCargarProcesosModal(false)
    setProcesosSeleccionados(new Set())
    setBusquedaProcesos('')
    setFechaInicioProcesos('')
    setFiltroTemporalidad('')
  }

  const toggleSeleccionProceso = (procesoId: number) => {
    setProcesosSeleccionados(prev => {
      const nuevo = new Set(prev)
      if (nuevo.has(procesoId)) {
        nuevo.delete(procesoId)
      } else {
        nuevo.add(procesoId)
      }
      return nuevo
    })
  }

  const cargarProcesosSeleccionados = async () => {
    if (procesosSeleccionados.size === 0) {
      showToastMessage('Seleccione al menos un proceso para cargar', 'warning')
      return
    }

    if (!fechaInicioProcesos) {
      showToastMessage('Seleccione una fecha de inicio', 'warning')
      return
    }

    try {
      // Obtener los procesos seleccionados
      const procesosACargar = procesosDisponibles.filter(p => procesosSeleccionados.has(p.id))

      // Usar generarCalendarioClienteProceso para cada proceso seleccionado (igual que en ClientesList.tsx)
      const calendarios: GenerarCalendarioParams[] = procesosACargar.map(proceso => ({
        cliente_id: clienteId,
        proceso_id: proceso.id,
        fecha_inicio: fechaInicioProcesos
      }))

      // Ejecutar todas las generaciones en paralelo (igual que en ClientesList.tsx)
      await Promise.all(calendarios.map(calendario => generarCalendarioClienteProceso(calendario)))

      showToastMessage(`${procesosSeleccionados.size} procesos generados correctamente`, 'success')
      cerrarModalCargarProcesos()

      // Recargar los procesos del cliente
      const res = await getClienteProcesosByCliente(clienteId)
      setProcesos(res.clienteProcesos || [])

    } catch (error) {
      console.error('Error al generar calendarios:', error)
      showToastMessage('Error al generar los calendarios', 'error')
    }
  }

  const toggleSeleccionMaestro = (hito: ClienteProcesoHito, checked: boolean) => {
    const maestroId = hito.hito_id
    setSelectedHitosMaestro(prev => {
      const next = new Set(prev)
      if (checked) next.add(maestroId); else next.delete(maestroId)
      return next
    })
  }

  const abrirModalDeshabilitarDesde = () => {
    setFechaDesdeDeshabilitar('')
    setSelectedHitosMaestro(new Set())
    setSelectedProcesos(new Set())
    setBusquedaHitosModal('')
    setBusquedaProcesosModal('')
    setModoDeshabilitar('hitos')
    setShowDeshabilitarDesdeModal(true)
  }

  const confirmarDeshabilitarDesde = async () => {
    if (!fechaDesdeDeshabilitar) {
      showToastMessage('Seleccione una fecha desde', 'warning')
      return
    }
    try {
      if (modoDeshabilitar === 'hitos') {
        const ids = Array.from(selectedHitosMaestro)
        if (ids.length === 0) {
          setShowDeshabilitarDesdeModal(false)
          return
        }
        await Promise.all(ids.map(id => deshabilitarHitosPorHitoDesde(id, fechaDesdeDeshabilitar)))
      } else {
        const procesoIds = Array.from(selectedProcesos)
        if (procesoIds.length === 0) {
          setShowDeshabilitarDesdeModal(false)
          return
        }

        // Obtener todos los hitos asociados a los procesos seleccionados
        const hitosPromises = procesoIds.map(procesoId =>
          getClienteProcesoHitosByProceso(procesoId)
        )

        const hitosArrays = await Promise.all(hitosPromises)
        const todosLosHitos = hitosArrays.flat()

        // Filtrar solo los hitos habilitados
        const hitosHabilitados = todosLosHitos.filter(hito => isHitoHabilitado(hito))

        // Extraer los IDs de los hitos maestros para deshabilitar
        const hitoIds = hitosHabilitados.map(hito => hito.hito_id)

        if (hitoIds.length === 0) {
          showToastMessage('No se encontraron hitos habilitados para los procesos seleccionados', 'warning')
          setShowDeshabilitarDesdeModal(false)
          return
        }

        // Usar deshabilitarHitosPorHitoDesde para cada hito individual
        await Promise.all(hitoIds.map(hitoId => deshabilitarHitosPorHitoDesde(hitoId, fechaDesdeDeshabilitar)))
      }
      setShowDeshabilitarDesdeModal(false)
      setSelectedHitosMaestro(new Set())
      setSelectedProcesos(new Set())
      // Recargar datos visibles
      const procesosVisibles: ClienteProceso[] = []
      Object.values(groupedProcesos).forEach(grupo => {
        const periodoData = grupo.periodos[selectedPeriod]
        if (periodoData) procesosVisibles.push(...periodoData.items)
      })
      await cargarHitosDeProcesos(procesosVisibles)
    } catch (e) {
      showToastMessage('Ocurrió un error al deshabilitar', 'error')
    }
  }

  // Debounce para el término de búsqueda principal
  useEffect(() => {
    if (busquedaNombre) {
      setSearchingNombre(true)
    }

    const timer = setTimeout(() => {
      setDebouncedBusquedaNombre(busquedaNombre)
      setSearchingNombre(false)
    }, 300) // 300ms de delay

    return () => {
      clearTimeout(timer)
      setSearchingNombre(false)
    }
  }, [busquedaNombre])

  useEffect(() => {
    getClienteById(clienteId).then(setCliente)
    getClienteProcesosByCliente(clienteId).then(res => setProcesos(res.clienteProcesos || []))
    getAllProcesos().then(res => setProcesosList(res.procesos || []))
    getAllHitos().then((res) => setHitosMaestro(res.hitos || []))
  }, [clienteId])

  // Cargar procesos disponibles cuando se abre el modal
  useEffect(() => {
    if (showCargarProcesosModal) {
      // Filtrar solo los procesos que NO están ya asignados al cliente
      const procesosAsignadosIds = new Set(procesos.map(p => p.proceso_id))
      const procesosDisponibles = procesosList.filter(proceso => !procesosAsignadosIds.has(proceso.id))
      setProcesosDisponibles(procesosDisponibles)
    }
  }, [showCargarProcesosModal, procesosList, procesos])

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

  // Función para cargar todos los hitos de los procesos
  const cargarHitosDeProcesos = async (procesosACarga: ClienteProceso[]) => {
    if (procesosACarga.length === 0) {
      setHitosPorProceso({})
      return
    }

    setLoadingHitos(true)
    const hitosMap: Record<number, ClienteProcesoHito[]> = {}

    try {
      // Cargar todos los hitos (habilitados y deshabilitados) para la vista de tabla
      // En la vista de calendario se filtrarán solo los habilitados
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
        // Mantener el orden de procesos; el orden por fecha se aplica a nivel de hitos
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

  const getNombreProceso = (cliente_proceso_id: number) => {
    const clienteProceso = procesos.find(p => p.id === cliente_proceso_id)
    if (clienteProceso) {
      const proceso = procesosList.find(proc => proc.id === clienteProceso.proceso_id)
      return proceso ? proceso.nombre : `Proceso ${clienteProceso.proceso_id}`
    }
    return 'Proceso no encontrado'
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

  // Devuelve los límites (inicio y fin) del mes seleccionado en los filtros (selectedPeriod: YYYY-MM)
  const getSelectedMonthBounds = () => {
    if (!selectedPeriod) return null
    const [yearStr, monthStr] = selectedPeriod.split('-')
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)
    if (Number.isNaN(year) || Number.isNaN(month)) return null
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0)
    return { start, end }
  }

  const formatDateInputFromDate = (date: Date) => date.toISOString().slice(0, 10)

  // Valida que una fecha (YYYY-MM-DD) esté dentro del mes seleccionado
  const isWithinSelectedMonth = (dateStr: string) => {
    const bounds = getSelectedMonthBounds()
    if (!bounds) return true
    const d = new Date(dateStr)
    return d >= bounds.start && d <= bounds.end
  }

  const handleFechaChange = (hitoId: number, campo: 'fecha_limite', valor: string) => {
    const hitoOriginal = Object.values(hitosPorProceso)
      .flat()
      .find(h => h.id === hitoId)

    if (!hitoOriginal) return

    const valorAnterior = hitoOriginal.fecha_limite || ''
    // No se permite borrar fecha_limite
    if (valor === '') {
      showToastMessage('La fecha límite es obligatoria y no se puede dejar vacía', 'warning')
      const lastValue = (hitosEditados[hitoId]?.fecha_limite || hitoOriginal.fecha_limite || '')
      const inputElement = document.querySelector(`input[data-hito-id="${hitoId}"][data-campo="${campo}"]`) as HTMLInputElement
      if (inputElement) {
        inputElement.value = formatDateForInput(lastValue)
      }
      return
    }
    const valorFinal = valor

    setHitosEditados(prev => ({
      ...prev,
      [hitoId]: {
        ...prev[hitoId],
        id: hitoId,
        fecha_limite: valorFinal,
        hora_limite: prev[hitoId]?.hora_limite || hitoOriginal.hora_limite
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


  // Quitar función de limpiar: fecha_limite no se puede borrar

  const handleHoraChange = (hitoId: number, valor: string) => {
    const hitoOriginal = Object.values(hitosPorProceso)
      .flat()
      .find(h => h.id === hitoId)

    if (!hitoOriginal) return

    const valorAnterior = hitoOriginal.hora_limite || ''
    // Normalizar formato de hora para comparación (quitar segundos)
    const valorAnteriorNormalizado = valorAnterior ? valorAnterior.substring(0, 5) : ''
    const valorNormalizado = valor ? valor.substring(0, 5) : ''

    setHitosEditados(prev => ({
      ...prev,
      [hitoId]: {
        ...prev[hitoId],
        id: hitoId,
        fecha_limite: prev[hitoId]?.fecha_limite || hitoOriginal.fecha_limite,
        hora_limite: valor
      }
    }))

    // Registrar el cambio solo si realmente cambió (comparando formatos normalizados)
    if (valorNormalizado !== valorAnteriorNormalizado) {
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


  const validarTodosLosCambios = () => true

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
      showToastMessage('No hay cambios para guardar', 'info')
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
          estado: hitoOriginal?.estado || 'Pendiente',
          fecha_estado: new Date().toISOString(),
          fecha_limite: hitoEditado.fecha_limite || undefined,
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
          observacionesGlobales
        )
      }

      showToastMessage(`Cambios guardados correctamente en ${Object.keys(hitosEditados).length} hitos. Se han registrado ${cambiosRealizados.length} cambios en el historial de auditoría.`, 'success')

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
      setObservacionesGlobales('')
    } catch (error) {
      console.error('Error guardando cambios:', error)
      showToastMessage('Error al guardar los cambios. Por favor, inténtelo de nuevo.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const cancelarCambios = () => {
    const confirmacion = window.confirm('¿Está seguro de que desea cancelar todos los cambios? Se perderán las modificaciones no guardadas.')
    if (confirmacion) {
      setHitosEditados({})
      setCambiosRealizados([])
      setObservacionesGlobales('')
    }
  }

  const mostrarResumenCambios = () => {
    if (cambiosRealizados.length === 0) return

    const resumen = cambiosRealizados.map(cambio => {
      const hito = Object.values(hitosPorProceso).flat().find(h => h.id === cambio.hitoId)
      const nombreHito = hito ? getNombreHito(hito.hito_id) : `Hito ${cambio.hitoId}`

      return `• ${nombreHito}: ${cambio.campo} (${cambio.valorAnterior} → ${cambio.valorNuevo})`
    }).join('\n')

    const observacionesTexto = observacionesGlobales ? `\n\nObservaciones:\n${observacionesGlobales}` : ''

    showToastMessage(`Resumen de cambios: ${resumen}${observacionesTexto}`, 'info')
  }

  const getValorHito = (hito: ClienteProcesoHito, campo: 'fecha_limite' | 'hora_limite') => {
    const hitoEditado = hitosEditados[hito.id]
    if (hitoEditado && hitoEditado[campo] !== undefined) {
      return hitoEditado[campo] || ''
    }

    const valorOriginal = campo === 'fecha_limite' ? hito.fecha_limite : hito.hora_limite

    // Manejar valores nulos, undefined o vacíos
    if (!valorOriginal || valorOriginal === 'null' || valorOriginal === 'undefined') {
      return ''
    }

    return valorOriginal
  }

  // Funciones para el modal de edición
  const editarHito = (hito: ClienteProcesoHito) => {
    // Permitir edición siempre (se elimina restricción por estado)

    setSelectedHito(hito)
    setEditForm({
      fecha_limite: formatDateForInput(hito.fecha_limite || ''),
      hora_limite: formatTimeForInput(hito.hora_limite),
      observaciones: ''
    })
    setShowEditModal(true)
  }

  const guardarHito = async () => {
    if (!selectedHito) return

    try {
      // Obtener valores originales para comparar
      const hitoOriginal = hitosPorProceso[selectedHito.cliente_proceso_id]?.find(h => h.id === selectedHito.id)
      if (!hitoOriginal) return

      await updateClienteProcesoHito(selectedHito.id, {
        estado: selectedHito.estado,
        fecha_estado: new Date().toISOString(),
        fecha_limite: editForm.fecha_limite || undefined,
        hora_limite: editForm.hora_limite || null
      })

      // Registrar auditoría para cada campo que cambió
      const cambios: Array<{ campo: string, anterior: string, nuevo: string }> = []

      // Verificar cambios en fecha_limite
      if ((hitoOriginal.fecha_limite || '') !== (editForm.fecha_limite || '')) {
        cambios.push({
          campo: 'fecha_limite',
          anterior: hitoOriginal.fecha_limite || '',
          nuevo: editForm.fecha_limite || ''
        })
      }

      // Verificar cambios en hora_limite (normalizar formato para comparación)
      const horaOriginalNormalizada = hitoOriginal.hora_limite ? hitoOriginal.hora_limite.substring(0, 5) : ''
      const horaNuevaNormalizada = editForm.hora_limite ? editForm.hora_limite.substring(0, 5) : ''

      if (horaOriginalNormalizada !== horaNuevaNormalizada) {
        cambios.push({
          campo: 'hora_limite',
          anterior: horaOriginalNormalizada,
          nuevo: horaNuevaNormalizada
        })
      }

      // Registrar auditoría para cada cambio
      for (const cambio of cambios) {
        await registrarAuditoria(
          selectedHito.id,
          cambio.campo,
          cambio.anterior,
          cambio.nuevo,
          editForm.observaciones
        )
      }

      // Si no hubo cambios específicos pero se guardó, registrar como edición general
      if (cambios.length === 0) {
        await registrarAuditoria(
          selectedHito.id,
          'hito_completo',
          'Sin cambios específicos',
          'Hito editado desde modal',
          editForm.observaciones
        )
      }

      setShowEditModal(false)
      setShowSuccess(true)

      // Recargar hitos para mostrar cambios (el hito podría haberse movido a otro mes)
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

      // Mostrar mensaje informativo si el hito se movió a otro mes
      if (editForm.fecha_limite) {
        const fechaSeleccionada = new Date(editForm.fecha_limite)
        const [year, month] = selectedPeriod.split('-').map(Number)
        const esMesDiferente = fechaSeleccionada.getFullYear() !== year || fechaSeleccionada.getMonth() !== (month - 1)

        if (esMesDiferente) {
          const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
          const nuevoMes = meses[fechaSeleccionada.getMonth()]
          const nuevoAno = fechaSeleccionada.getFullYear()
          showToastMessage(`El hito se ha movido al mes de ${nuevoMes} ${nuevoAno}. Para verlo, cambie al período correspondiente en el filtro de meses.`, 'info')
        }
      }
    } catch (error) {
      console.error('Error guardando hito:', error)
      setErrorMessage('Error al guardar el hito')
      setShowError(true)
    }
  }

  const verHistorial = (hitoId: number) => {
    setShowHistorialAuditoria(true)
  }

  // Función para obtener hitos filtrados
  const getHitosFiltrados = () => {
    let hitosFiltrados = Object.values(hitosPorProceso).flat()

    // En vista de calendario, solo mostrar hitos habilitados
    if (vistaCalendario) {
      hitosFiltrados = hitosFiltrados.filter(hito => isHitoHabilitado(hito))
    }

    if (filtroProceso) {
      hitosFiltrados = hitosFiltrados.filter(hito => {
        const proceso = procesos.find(p => p.id === hito.cliente_proceso_id)
        return proceso?.proceso_id === parseInt(filtroProceso)
      })
    }

    // Filtro por nombre de hito (ignora mayúsculas y tildes)
    if (debouncedBusquedaNombre.trim() !== '') {
      const normalizeText = (text: string) =>
        text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
      const termino = normalizeText(debouncedBusquedaNombre)
      hitosFiltrados = hitosFiltrados.filter(hito => {
        const nombre = normalizeText(getNombreHito(hito.hito_id))
        return nombre.includes(termino)
      })
    }

    // Ordenar por fecha límite (ascendente)
    return hitosFiltrados.sort((a, b) => {
      const fechaA = new Date(a.fecha_limite).getTime()
      const fechaB = new Date(b.fecha_limite).getTime()
      return fechaA - fechaB
    })
  }

  // Función para obtener procesos filtrados
  const getProcesosFiltrados = () => {
    return procesos.filter(p =>
      Object.values(groupedProcesos).some(grupo =>
        grupo.periodos[selectedPeriod]?.items.some(item => item.id === p.id)
      )
    )
  }

  // Función para sincronizar la selección de procesos basada en hitos seleccionados
  const sincronizarProcesosDesdeHitos = () => {
    const hitosSeleccionados = Array.from(selectedHitosMaestro)
    const procesosConHitosSeleccionados = new Set<number>()

    hitosSeleccionados.forEach(hitoId => {
      const hito = getHitosFiltrados().find(h => h.hito_id === hitoId)
      if (hito) {
        procesosConHitosSeleccionados.add(hito.cliente_proceso_id)
      }
    })

    // Verificar si todos los hitos de cada proceso están seleccionados
    const procesosCompletamenteSeleccionados = new Set<number>()
    procesosConHitosSeleccionados.forEach(procesoId => {
      const hitosDelProceso = getHitosFiltrados().filter(h => h.cliente_proceso_id === procesoId)
      const hitosDelProcesoSeleccionados = hitosDelProceso.filter(h => selectedHitosMaestro.has(h.hito_id))
      if (hitosDelProceso.length === hitosDelProcesoSeleccionados.length) {
        procesosCompletamenteSeleccionados.add(procesoId)
      }
    })

    setSelectedProcesos(procesosCompletamenteSeleccionados)
  }

  // Función para obtener días del mes actual
  // Construye 6x7 celdas con días del mes anterior y siguiente
  const getCeldasCalendario = () => {
    if (!selectedPeriod) return [] as Array<{ date: Date, actual: boolean }>
    const [year, month] = selectedPeriod.split('-').map(Number)

    // Usar UTC para evitar problemas de zona horaria
    const primeroMes = new Date(Date.UTC(year, month - 1, 1))
    // Lunes=0 ... Domingo=6 (ajustamos desde getDay() que es 0=Dom)
    const weekday = (primeroMes.getDay() + 6) % 7

    // Calcular el primer día del grid (puede ser del mes anterior)
    const inicioGrid = new Date(Date.UTC(year, month - 1, 1 - weekday))

    const celdas: Array<{ date: Date, actual: boolean }> = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(Date.UTC(inicioGrid.getUTCFullYear(), inicioGrid.getUTCMonth(), inicioGrid.getUTCDate() + i))
      const esActual = d.getUTCMonth() === (month - 1)
      celdas.push({ date: d, actual: esActual })
    }
    return celdas
  }

  // Función para obtener hitos de una fecha completa (YYYY-MM-DD)
  const getHitosDeFecha = (fecha: Date) => {
    const fechaStr = fecha.toISOString().split('T')[0]
    return getHitosFiltrados().filter(hito => hito.fecha_limite === fechaStr)
  }

  return (
    <>
      <style>{`
        .calendar-day .day-hitos::-webkit-scrollbar {
          width: 6px;
        }

        .calendar-day .day-hitos::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .calendar-day .day-hitos::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .calendar-day .day-hitos::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        .calendar-day .day-hitos {
          scrollbar-width: thin;
          scrollbar-color: #c1c1c1 #f1f1f1;
        }

        .hito-card {
          position: relative;
          flex-shrink: 0;
        }

        .hito-card:hover {
          z-index: 10;
        }
      `}</style>
      <div
        className="editar-calendario-container"
        style={{
          fontFamily: atisaStyles.fonts.secondary,
          backgroundColor: '#f8f9fa',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header fijo */}
        <header
          className="calendario-header"
          style={{
            background: 'linear-gradient(135deg, #00505c 0%, #007b8a 100%)',
            color: 'white',
            padding: '1.5rem 2rem',
            boxShadow: '0 4px 20px rgba(0, 80, 92, 0.15)',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <div
            className="header-content"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: '1200px',
              margin: '0 auto'
            }}
          >
            <button
              className="back-button"
              onClick={() => navigate('/clientes')}
              style={{
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

            <div
              className="title-section"
              style={{
                textAlign: 'center',
                flex: 1
              }}
            >
              <h1
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
                <i className="bi bi-pencil-square" style={{ color: 'white' }}></i>
                Editar Calendario
              </h1>
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

            <div
              className="header-actions"
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}
            >
              <button
                className="btn"
                onClick={() => setVistaCalendario(!vistaCalendario)}
                style={{
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
              >
                <i className={`bi ${vistaCalendario ? 'bi-table' : 'bi-calendar3'}`} style={{ color: 'white' }}></i>
                {vistaCalendario ? 'Vista Tabla' : 'Vista Calendario'}
              </button>
            </div>
          </div>
        </header>

        {/* Layout principal */}
        <div
          className="main-layout"
          style={{
            display: 'flex',
            flex: 1,
            gap: '1rem',
            padding: '1rem',
            width: '100%'
          }}
        >
          {/* Sidebar con filtros */}
          <aside
            className="sidebar"
            style={{
              width: '20%',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
              height: 'fit-content',
              position: 'sticky',
              top: '120px'
            }}
          >
            <div className="filter-section">
              <h3
                style={{
                  fontFamily: atisaStyles.fonts.primary,
                  color: atisaStyles.colors.primary,
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="bi bi-funnel" style={{ color: atisaStyles.colors.primary }}></i>
                Filtros
              </h3>

              {/* Selector de período */}
              <div className="period-selector" style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: atisaStyles.colors.dark,
                    marginBottom: '8px',
                    display: 'block'
                  }}
                >
                  Período
                </label>
                <div
                  className="period-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                    gap: '8px'
                  }}
                >
                  {periodos.map((periodo) => {
                    const [year, month] = periodo.split('-')
                    const isSelected = selectedPeriod === periodo
                    return (
                      <button
                        key={periodo}
                        className={`period-card ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedPeriod(periodo)}
                        style={{
                          backgroundColor: isSelected ? atisaStyles.colors.secondary : 'white',
                          color: isSelected ? 'white' : atisaStyles.colors.primary,
                          border: `2px solid ${isSelected ? atisaStyles.colors.accent : atisaStyles.colors.light}`,
                          borderRadius: '8px',
                          fontFamily: atisaStyles.fonts.secondary,
                          fontWeight: '600',
                          padding: '12px 8px',
                          fontSize: '12px',
                          transition: 'all 0.3s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(156, 186, 57, 0.3)' : '0 2px 8px rgba(0, 80, 92, 0.1)',
                          textAlign: 'center',
                          cursor: 'pointer'
                        }}
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
                        <div className="month" style={{ fontSize: '11px', fontWeight: 'bold' }}>
                          {getMesName(parseInt(month))}
                        </div>
                        <div className="year" style={{ fontSize: '10px', opacity: 0.8 }}>
                          {year}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Filtros adicionales */}
              <div className="additional-filters">


                <div className="filter-group" style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: atisaStyles.colors.dark,
                      marginBottom: '8px',
                      display: 'block'
                    }}
                  >
                    Proceso
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={filtroProceso}
                    onChange={(e) => setFiltroProceso(e.target.value)}
                    style={{
                      fontFamily: atisaStyles.fonts.secondary,
                      fontSize: '14px',
                      border: `1px solid ${atisaStyles.colors.light}`,
                      borderRadius: '6px'
                    }}
                  >
                    <option value="">Todos los procesos</option>
                    {procesosList.map(proceso => (
                      <option key={proceso.id} value={proceso.id.toString()}>
                        {proceso.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Indicadores de cambios */}
                {Object.keys(hitosEditados).length > 0 && (
                  <div
                    className="changes-indicator"
                    style={{
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '1rem'
                    }}
                  >
                    <div
                      className="changes-badge"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#856404',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      <i className="bi bi-pencil-square" style={{ color: '#ffc107' }}></i>
                      <span>{Object.keys(hitosEditados).length} hitos modificados</span>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    className="btn btn-sm"
                    onClick={() => setShowHistorialAuditoria(true)}
                    style={{
                      backgroundColor: atisaStyles.colors.accent,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontFamily: atisaStyles.fonts.secondary,
                      fontWeight: '600',
                      padding: '8px 12px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="bi bi-clock-history" style={{ color: 'white' }}></i>
                    Ver Historial
                  </button>

                  {Object.keys(hitosEditados).length > 0 && (
                    <>
                      <button
                        className="btn btn-sm"
                        onClick={mostrarResumenCambios}
                        style={{
                          backgroundColor: atisaStyles.colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontFamily: atisaStyles.fonts.secondary,
                          fontWeight: '600',
                          padding: '8px 12px',
                          fontSize: '14px',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className="bi bi-list-ul" style={{ color: 'white' }}></i>
                        Ver Resumen
                      </button>

                      <button
                        className="btn btn-sm"
                        onClick={cancelarCambios}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontFamily: atisaStyles.fonts.secondary,
                          fontWeight: '600',
                          padding: '8px 12px',
                          fontSize: '14px',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className="bi bi-x-circle" style={{ color: 'white' }}></i>
                        Cancelar
                      </button>

                      <button
                        className="btn btn-sm"
                        onClick={guardarCambios}
                        disabled={saving}
                        style={{
                          backgroundColor: atisaStyles.colors.secondary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontFamily: atisaStyles.fonts.secondary,
                          fontWeight: '600',
                          padding: '8px 12px',
                          fontSize: '14px',
                          transition: 'all 0.3s ease',
                          opacity: saving ? 0.7 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle" style={{ color: 'white' }}></i>
                            Guardar Cambios
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Área de contenido principal */}
          <main
            className="content-area"
            style={{
              width: '80%',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
              minHeight: '600px',
              display: 'flex',
              justifyContent: 'center'
            }}
          >

            {/* Vista de calendario o tabla */}
            {vistaCalendario ? (
              /* Vista de calendario */
              <div className="calendar-view">
                <div
                  className="calendar-header"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                    padding: '1.5rem',
                    backgroundColor: atisaStyles.colors.light,
                    borderRadius: '8px',
                    minHeight: '80px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontFamily: atisaStyles.fonts.primary,
                        color: atisaStyles.colors.primary,
                        fontWeight: 'bold',
                        margin: 0,
                        fontSize: '1.5rem'
                      }}
                    >
                      Vista Calendario
                    </h3>
                    {selectedPeriod && (
                      <p
                        style={{
                          margin: '4px 0 0 0',
                          fontSize: '1rem',
                          color: atisaStyles.colors.dark,
                          opacity: 0.8
                        }}
                      >
                        {getMesName(parseInt(selectedPeriod.split('-')[1]))} {selectedPeriod.split('-')[0]}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setVistaCalendario(false)}
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        fontSize: '12px',
                        padding: '8px 16px',
                        height: '40px'
                      }}
                    >
                      <i className="bi bi-table me-1"></i>
                      Vista Tabla
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  {/* Cabeceras de días de la semana */}
                  <div
                    className="calendar-weekdays"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '14px',
                      width: '100%',
                      maxWidth: '2000px',
                      marginBottom: '8px'
                    }}
                  >
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                      <div
                        key={d}
                        style={{
                          textAlign: 'center',
                          fontWeight: 600,
                          color: atisaStyles.colors.dark,
                          backgroundColor: 'white',
                          border: '1px solid #e9ecef',
                          borderRadius: '6px',
                          padding: '8px'
                        }}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  <div
                    className="calendar-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gridTemplateRows: 'repeat(6, 1fr)', // 6 filas fijas
                      gap: '14px',
                      height: '1000px', // Altura fija más grande para el grid completo
                      width: '100%',
                      maxWidth: '2000px' // Ancho máximo más grande para aprovechar el 80%
                    }}
                  >
                    {getCeldasCalendario().map(({ date, actual }, idx) => {
                      const hitosDelDia = getHitosDeFecha(date)
                      return (
                        <div
                          key={idx}
                          className="calendar-day"
                          style={{
                            backgroundColor: actual ? '#f8f9fa' : '#f1f3f5',
                            border: '1px solid #e9ecef',
                            borderRadius: '8px',
                            padding: '14px',
                            height: '155px', // Altura fija más grande para todos los días
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            className="day-number"
                            style={{
                              fontWeight: 'bold',
                              fontSize: '14px',
                              color: actual ? atisaStyles.colors.primary : '#adb5bd',
                              marginBottom: '8px',
                              flexShrink: 0,
                              textAlign: 'center',
                              padding: '4px',
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              border: '1px solid #e9ecef'
                            }}
                          >
                            {date.getDate()}
                          </div>
                          <div
                            className="day-hitos"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '7px',
                              flex: 1,
                              overflowY: 'auto',
                              maxHeight: '125px', // Altura máxima más grande para el área de hitos
                              paddingRight: '5px'
                            }}
                          >
                            {hitosDelDia.length === 0 ? (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: '100%',
                                  color: '#6c757d',
                                  fontSize: '11px',
                                  fontStyle: 'italic',
                                  textAlign: 'center'
                                }}
                              >
                                Sin hitos
                              </div>
                            ) : (
                              hitosDelDia.map(hito => (
                                <div
                                  key={hito.id}
                                  className="hito-card"
                                  onClick={() => editarHito(hito)}
                                  style={{
                                    backgroundColor: atisaStyles.colors.accent,
                                    color: 'white',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    border: hitosEditados[hito.id] ? '2px solid #ffc107' : 'none',
                                    flexShrink: 0,
                                    minHeight: '70px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.02)'
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 80, 92, 0.3)'
                                    e.currentTarget.style.zIndex = '10'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)'
                                    e.currentTarget.style.boxShadow = 'none'
                                    e.currentTarget.style.zIndex = '1'
                                  }}
                                >
                                  <div
                                    className="hito-name"
                                    style={{
                                      fontWeight: '700',
                                      whiteSpace: 'normal',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      fontSize: '14px',
                                      lineHeight: '1.3',
                                      marginBottom: '5px',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      maxHeight: '32px'
                                    }}
                                    title={getNombreHito(hito.hito_id)}
                                  >
                                    {getNombreHito(hito.hito_id)}
                                  </div>
                                  <div
                                    className="hito-proceso"
                                    style={{
                                      fontSize: '11px',
                                      opacity: 0.95,
                                      whiteSpace: 'normal',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      marginBottom: '5px',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 1,
                                      WebkitBoxOrient: 'vertical',
                                      fontWeight: '500'
                                    }}
                                    title={getNombreProceso(hito.cliente_proceso_id)}
                                  >
                                    {getNombreProceso(hito.cliente_proceso_id)}
                                  </div>
                                  {hito.hora_limite && (
                                    <div
                                      className="hito-time"
                                      style={{
                                        fontSize: '10px',
                                        opacity: 0.8,
                                        textAlign: 'center',
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        borderRadius: '3px',
                                        padding: '3px 8px'
                                      }}
                                    >
                                      {hito.hora_limite.substring(0, 5)}
                                    </div>
                                  )}
                                  {hitosEditados[hito.id] && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: '2px',
                                        right: '2px',
                                        fontSize: '8px',
                                        color: '#ffc107'
                                      }}
                                    >
                                      <i className="bi bi-pencil-square"></i>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>

                          {/* Indicador de scroll vertical si hay más de 2 hitos */}
                          {hitosDelDia.length > 2 && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '4px',
                                right: '4px',
                                backgroundColor: 'rgba(0, 80, 92, 0.8)',
                                color: 'white',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                fontSize: '9px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                              title={`${hitosDelDia.length} hitos - Desliza verticalmente para ver más`}
                            >
                              <i className="bi bi-arrow-up-down" style={{ fontSize: '8px' }}></i>
                              {hitosDelDia.length}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Vista de tabla mejorada */
              <div
                className="hitos-table-container"
                style={{
                  width: '100%',
                  maxWidth: '2000px' // Aprovechar el 80% del espacio
                }}
              >
                <div
                  className="table-header"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    padding: '1.5rem',
                    backgroundColor: atisaStyles.colors.light,
                    borderRadius: '8px',
                    minHeight: '80px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontFamily: atisaStyles.fonts.primary,
                        color: atisaStyles.colors.primary,
                        fontWeight: 'bold',
                        margin: 0,
                        fontSize: '1.5rem'
                      }}
                    >
                      Hitos del Período
                    </h3>
                    {selectedPeriod && (
                      <p
                        style={{
                          margin: '4px 0 0 0',
                          fontSize: '1rem',
                          color: atisaStyles.colors.dark,
                          opacity: 0.8
                        }}
                      >
                        {getMesName(parseInt(selectedPeriod.split('-')[1]))} {selectedPeriod.split('-')[0]}
                      </p>
                    )}
                  </div>
                  <div className="table-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setVistaCalendario(true)}
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        fontSize: '12px',
                        padding: '8px 16px',
                        height: '40px'
                      }}
                    >
                      <i className="bi bi-calendar3 me-1"></i>
                      Vista Calendario
                    </button>
                  </div>
                </div>

                {/* Campo de observaciones - Solo visible cuando hay cambios */}
                {Object.keys(hitosEditados).length > 0 && (
                  <div
                    className="mb-4"
                    style={{
                      backgroundColor: '#fff3cd',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #ffeaa7',
                      marginBottom: '1.5rem'
                    }}
                  >
                    <div className="row">
                      <div className="col-12">
                        <label className="form-label" style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#856404',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <i className="bi bi-chat-text" style={{ color: '#ffc107' }}></i>
                          Observaciones de los cambios realizados
                        </label>
                        <textarea
                          className="form-control"
                          value={observacionesGlobales}
                          onChange={(e) => setObservacionesGlobales(e.target.value)}
                          placeholder="Describa los cambios realizados en los hitos..."
                          rows={2}
                          style={{
                            fontSize: '14px',
                            fontFamily: atisaStyles.fonts.secondary,
                            border: `1px solid #ffeaa7`,
                            borderRadius: '6px',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className="table-responsive"
                  style={{
                    width: '100%',
                    overflowX: 'auto'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-3" style={{ gap: '12px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar por nombre de hito..."
                        value={busquedaNombre}
                        onChange={(e) => setBusquedaNombre(e.target.value)}
                        style={{
                          fontFamily: atisaStyles.fonts.secondary,
                          fontSize: '14px',
                          border: `1px solid ${atisaStyles.colors.light}`,
                          borderRadius: '6px',
                          paddingRight: searchingNombre ? '50px' : '12px'
                        }}
                      />
                      {searchingNombre && (
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
                    <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                      <button
                        className="btn btn-sm"
                        style={{ backgroundColor: atisaStyles.colors.accent, color: 'white', borderRadius: 6, fontFamily: atisaStyles.fonts.secondary, fontWeight: 600, padding: '8px 12px' }}
                        onClick={abrirModalCargarProcesos}
                        title={'Cargar procesos al calendario'}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Cargar procesos
                      </button>
                      {procesos.length > 0 && (
                        <button
                          className="btn btn-sm"
                          style={{ backgroundColor: atisaStyles.colors.secondary, color: 'white', borderRadius: 6, fontFamily: atisaStyles.fonts.secondary, fontWeight: 600, padding: '8px 12px' }}
                          onClick={abrirModalDeshabilitarDesde}
                          title={'Deshabilitar a partir de fecha'}
                        >
                          <i className="bi bi-slash-circle me-2"></i>
                          Deshabilitado múltiple
                        </button>
                      )}
                    </div>
                  </div>
                  <table
                    className="hitos-table"
                    style={{
                      width: '100%',
                      minWidth: '800px', // Ancho mínimo reducido
                      borderCollapse: 'collapse',
                      fontFamily: atisaStyles.fonts.secondary,
                      tableLayout: 'fixed' // Para controlar mejor el ancho de las columnas
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: atisaStyles.colors.primary, color: 'white' }}>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', fontSize: '15px', width: '40%' }}>
                          Hito
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', fontSize: '15px', width: '25%' }}>
                          Proceso
                        </th>

                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', fontSize: '15px', width: '20%' }}>
                          Fecha Límite
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', fontSize: '15px', width: '15%' }}>
                          Hora Límite
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
                      ) : (
                        getHitosFiltrados().map((hito, index) => {
                          const hasChanges = hitosEditados[hito.id] !== undefined

                          return (
                            <tr
                              key={hito.id}
                              style={{
                                backgroundColor: hasChanges
                                  ? '#fff3cd'
                                  : !isHitoHabilitado(hito)
                                    ? '#f8d7da'
                                    : (index % 2 === 0 ? 'white' : '#f8f9fa'),
                                transition: 'all 0.2s ease',
                                borderLeft: hasChanges
                                  ? `4px solid ${atisaStyles.colors.warning}`
                                  : !isHitoHabilitado(hito)
                                    ? '4px solid #dc3545'
                                    : 'none',
                                opacity: !isHitoHabilitado(hito) ? 0.8 : 1
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = hasChanges
                                  ? '#ffeaa7'
                                  : !isHitoHabilitado(hito)
                                    ? '#f5c6cb'
                                    : atisaStyles.colors.light
                                e.currentTarget.style.transform = 'translateY(-1px)'
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 80, 92, 0.1)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = hasChanges
                                  ? '#fff3cd'
                                  : !isHitoHabilitado(hito)
                                    ? '#f8d7da'
                                    : (index % 2 === 0 ? 'white' : '#f8f9fa')
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'none'
                              }}
                            >
                              <td style={{ padding: '16px', verticalAlign: 'top', width: '40%' }}>
                                <div
                                  className="hito-info"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                >
                                  {/* Selección se traslada al modal; eliminamos checkbox por fila */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <button
                                      onClick={() => toggleHabilitarHito(hito)}
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '10px',
                                        borderRadius: '4px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: isHitoHabilitado(hito) ? '#dc3545' : '#28a745',
                                        color: 'white',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        flexShrink: 0
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = '0.8'
                                        e.currentTarget.style.transform = 'scale(1.05)'
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = '1'
                                        e.currentTarget.style.transform = 'scale(1)'
                                      }}
                                      title={isHitoHabilitado(hito) ? 'Deshabilitar hito' : 'Habilitar hito'}
                                    >
                                      <i className={`bi ${isHitoHabilitado(hito) ? 'bi-x-circle' : 'bi-check-circle'}`}></i>
                                      {isHitoHabilitado(hito) ? 'Deshabilitar' : 'Habilitar'}
                                    </button>
                                    <span
                                      style={{
                                        fontFamily: atisaStyles.fonts.secondary,
                                        color: atisaStyles.colors.primary,
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        lineHeight: '1.4',
                                        wordWrap: 'break-word',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        flex: 1
                                      }}
                                    >
                                      {getNombreHito(hito.hito_id)}
                                    </span>
                                    {hasChanges && (
                                      <i className="bi bi-pencil-square" style={{ color: '#ffc107' }}></i>
                                    )}
                                  </div>

                                </div>
                              </td>
                              <td style={{ padding: '16px', verticalAlign: 'top', width: '25%' }}>
                                <span
                                  style={{
                                    fontFamily: atisaStyles.fonts.secondary,
                                    color: atisaStyles.colors.dark,
                                    fontSize: '12px',
                                    backgroundColor: atisaStyles.colors.light,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    display: 'inline-block',
                                    fontWeight: '500',
                                    wordWrap: 'break-word',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '100%'
                                  }}
                                >
                                  {getNombreProceso(hito.cliente_proceso_id)}
                                </span>
                              </td>

                              <td style={{ padding: '16px', verticalAlign: 'top', width: '20%' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={formatDateForInput(getValorHito(hito, 'fecha_limite'))}
                                    onChange={(e) => handleFechaChange(hito.id, 'fecha_limite', e.target.value)}
                                    data-hito-id={hito.id}
                                    data-campo="fecha_limite"
                                    style={{
                                      fontFamily: atisaStyles.fonts.secondary,
                                      fontSize: '12px',
                                      border: hasChanges ? `2px solid ${atisaStyles.colors.warning}` : `1px solid ${atisaStyles.colors.light}`,
                                      borderRadius: '6px',
                                      width: '100%'
                                    }}
                                  />
                                </div>
                              </td>
                              <td style={{ padding: '16px', verticalAlign: 'top', width: '15%' }}>
                                <input
                                  type="time"
                                  className="form-control form-control-sm"
                                  value={formatTimeForInput(getValorHito(hito, 'hora_limite'))}
                                  onChange={(e) => handleHoraChange(hito.id, e.target.value)}

                                  style={{
                                    fontFamily: atisaStyles.fonts.secondary,
                                    fontSize: '12px',
                                    border: hasChanges ? `2px solid ${atisaStyles.colors.warning}` : `1px solid ${atisaStyles.colors.light}`,
                                    borderRadius: '6px',
                                    width: '100%'
                                  }}
                                />
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>


        {/* Modal de edición de hito mejorado */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
          <Modal.Header
            style={{
              backgroundColor: atisaStyles.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '12px 12px 0 0',
              padding: '20px 24px'
            }}
          >
            <Modal.Title
              style={{
                fontFamily: atisaStyles.fonts.primary,
                fontWeight: 'bold',
                color: 'white',
                fontSize: '1.25rem',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <i className="bi bi-pencil-square" style={{ color: 'white' }}></i>
              Editar Hito
            </Modal.Title>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => setShowEditModal(false)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
              }}
            >
              <i className="bi bi-x" style={{ color: 'white', fontSize: '16px' }}></i>
            </button>
          </Modal.Header>

          <Modal.Body style={{ padding: '24px' }}>
            {/* Información del hito */}
            <div
              className="mb-4 p-3"
              style={{
                backgroundColor: atisaStyles.colors.light,
                borderRadius: '8px',
                border: `1px solid ${atisaStyles.colors.accent}`
              }}
            >
              <div className="row">
                <div className="col-md-6">
                  <label style={{ fontSize: '12px', fontWeight: '600', color: atisaStyles.colors.dark, marginBottom: '4px' }}>
                    HITO
                  </label>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: atisaStyles.colors.primary }}>
                    {selectedHito ? getNombreHito(selectedHito.hito_id) : ''}
                  </div>
                </div>
                <div className="col-md-6">
                  <label style={{ fontSize: '12px', fontWeight: '600', color: atisaStyles.colors.dark, marginBottom: '4px' }}>
                    PROCESO
                  </label>
                  <div style={{ fontSize: '14px', color: atisaStyles.colors.dark }}>
                    {selectedHito ? getNombreProceso(selectedHito.cliente_proceso_id) : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario de edición */}
            <div className="hito-edit-form">
              {/* Advertencia sobre cambio de mes */}
              {selectedHito && selectedPeriod && editForm.fecha_limite && (() => {
                const fechaSeleccionada = new Date(editForm.fecha_limite)
                const [year, month] = selectedPeriod.split('-').map(Number)
                const mesSeleccionado = new Date(year, month - 1, 1)
                const esMesDiferente = fechaSeleccionada.getFullYear() !== year || fechaSeleccionada.getMonth() !== (month - 1)

                return esMesDiferente ? (
                  <div
                    className="alert alert-warning mb-4"
                    style={{
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className="bi bi-exclamation-triangle" style={{ color: '#856404', fontSize: '16px' }}></i>
                    <div>
                      <strong style={{ color: '#856404', fontSize: '14px' }}>Cambio de mes detectado</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#856404' }}>
                        La fecha seleccionada está en un mes diferente al período actual.
                        El hito se moverá al mes correspondiente.
                      </p>
                    </div>
                  </div>
                ) : null
              })()}

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-4">
                    <label className="form-label" style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: atisaStyles.colors.dark,
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <i className="bi bi-calendar3" style={{ color: atisaStyles.colors.primary }}></i>
                      Fecha Límite *
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={editForm.fecha_limite || ''}
                      onChange={(e) => {
                        const newVal = e.target.value || ''
                        if (!newVal) {
                          showToastMessage('La fecha límite es obligatoria y no se puede dejar vacía', 'warning')
                          e.target.value = editForm.fecha_limite || ''
                          return
                        }
                        setEditForm({ ...editForm, fecha_limite: newVal })
                      }}
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        fontSize: '14px',
                        border: `2px solid ${atisaStyles.colors.light}`,
                        borderRadius: '8px',
                        padding: '12px',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = atisaStyles.colors.accent
                        e.target.style.boxShadow = `0 0 0 3px rgba(0, 161, 222, 0.1)`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = atisaStyles.colors.light
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-4">
                    <label className="form-label" style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: atisaStyles.colors.dark,
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <i className="bi bi-clock" style={{ color: atisaStyles.colors.primary }}></i>
                      Hora Límite
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={editForm.hora_limite || ''}
                      onChange={(e) => setEditForm({ ...editForm, hora_limite: e.target.value || null })}
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        fontSize: '14px',
                        border: `2px solid ${atisaStyles.colors.light}`,
                        borderRadius: '8px',
                        padding: '12px',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = atisaStyles.colors.accent
                        e.target.style.boxShadow = `0 0 0 3px rgba(0, 161, 222, 0.1)`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = atisaStyles.colors.light
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label" style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: atisaStyles.colors.dark,
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className="bi bi-chat-text" style={{ color: atisaStyles.colors.primary }}></i>
                  Observaciones
                </label>
                <textarea
                  className="form-control"
                  value={editForm.observaciones}
                  onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })}
                  rows={4}
                  placeholder="Agregue observaciones sobre los cambios realizados en este hito..."
                  style={{
                    fontFamily: atisaStyles.fonts.secondary,
                    fontSize: '14px',
                    border: `2px solid ${atisaStyles.colors.light}`,
                    borderRadius: '8px',
                    padding: '12px',
                    resize: 'vertical',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = atisaStyles.colors.accent
                    e.target.style.boxShadow = `0 0 0 3px rgba(0, 161, 222, 0.1)`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = atisaStyles.colors.light
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer
            style={{
              backgroundColor: '#f8f9fa',
              border: 'none',
              padding: '20px 24px',
              borderRadius: '0 0 12px 12px'
            }}
          >
            <button
              className="btn"
              onClick={() => setShowEditModal(false)}
              style={{
                fontFamily: atisaStyles.fonts.secondary,
                fontSize: '14px',
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5a6268'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6c757d'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <i className="bi bi-x-circle me-2"></i>
              Cancelar
            </button>
            <button
              className="btn"
              onClick={guardarHito}
              style={{
                fontFamily: atisaStyles.fonts.secondary,
                fontSize: '14px',
                padding: '10px 20px',
                backgroundColor: atisaStyles.colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(156, 186, 57, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <i className="bi bi-check-circle me-2"></i>
              Guardar Cambios
            </button>
          </Modal.Footer>
        </Modal>

        {/* Modal de Historial de Auditoría */}
        <HistorialAuditoriaModal
          show={showHistorialAuditoria}
          onHide={() => setShowHistorialAuditoria(false)}
          clienteId={clienteId}
        />

        {/* Notificaciones Toast */}
        <CustomToast
          show={showSuccess}
          onClose={() => setShowSuccess(false)}
          message="Los cambios se han guardado correctamente"
          type="success"
          delay={3000}
        />
        <CustomToast
          show={showError}
          onClose={() => setShowError(false)}
          message={errorMessage || 'Ha ocurrido un error al guardar los cambios'}
          type="error"
          delay={5000}
        />
      </div>

      {/* Modal deshabilitar desde fecha */}
      {showDeshabilitarDesdeModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: 12 }}>
              <div className="modal-header" style={{ backgroundColor: atisaStyles.colors.primary, color: 'white', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                <h5 className="modal-title" style={{
                  margin: 0,
                  fontFamily: atisaStyles.fonts.primary,
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>Deshabilitar desde fecha</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeshabilitarDesdeModal(false)}></button>
              </div>
              <div className="modal-body" style={{ fontFamily: atisaStyles.fonts.secondary }}>
                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: 600 }}>Fecha desde</label>
                  <input type="date" className="form-control" value={fechaDesdeDeshabilitar} onChange={(e) => setFechaDesdeDeshabilitar(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: 600 }}>Tipo de deshabilitación</label>
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn ${modoDeshabilitar === 'hitos' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => {
                        setModoDeshabilitar('hitos')
                        // No resetear selecciones, solo limpiar búsquedas
                        setBusquedaHitosModal('')
                        setBusquedaProcesosModal('')
                        // Sincronizar procesos basado en hitos seleccionados
                        setTimeout(() => {
                          sincronizarProcesosDesdeHitos()
                        }, 0)
                      }}
                    >
                      Por Hitos
                    </button>
                    <button
                      type="button"
                      className={`btn ${modoDeshabilitar === 'procesos' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => {
                        setModoDeshabilitar('procesos')
                        // No resetear selecciones, solo limpiar búsquedas
                        setBusquedaHitosModal('')
                        setBusquedaProcesosModal('')
                        // Sincronizar hitos basado en procesos seleccionados
                        setTimeout(() => {
                          const procesosSeleccionados = Array.from(selectedProcesos)
                          const hitosASeleccionar = new Set<number>()
                          procesosSeleccionados.forEach(procesoId => {
                            const hitosDelProceso = getHitosFiltrados().filter(h => h.cliente_proceso_id === procesoId)
                            hitosDelProceso.forEach(h => hitosASeleccionar.add(h.hito_id))
                          })
                          setSelectedHitosMaestro(hitosASeleccionar)
                        }, 0)
                      }}
                    >
                      Por Procesos
                    </button>
                  </div>
                </div>
                <div className="mb-2 d-flex justify-content-between align-items-center" style={{ gap: '8px' }}>
                  <label className="form-label m-0" style={{ fontWeight: 600 }}>
                    {modoDeshabilitar === 'hitos' ? 'Seleccione los hitos a deshabilitar' : 'Seleccione los procesos a deshabilitar'}
                  </label>
                  <small style={{ color: atisaStyles.colors.dark }}>
                    {modoDeshabilitar === 'hitos' ? selectedHitosMaestro.size : selectedProcesos.size} seleccionados
                  </small>
                </div>
                <div className="d-flex align-items-center mb-2" style={{ gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={modoDeshabilitar === 'hitos' ? 'Buscar hito...' : 'Buscar proceso...'}
                    value={modoDeshabilitar === 'hitos' ? busquedaHitosModal : busquedaProcesosModal}
                    onChange={(e) => {
                      if (modoDeshabilitar === 'hitos') {
                        setBusquedaHitosModal(e.target.value)
                      } else {
                        setBusquedaProcesosModal(e.target.value)
                      }
                    }}
                    style={{ maxWidth: 260 }}
                  />
                  <button
                    className="btn btn-sm"
                    style={{ backgroundColor: atisaStyles.colors.light, border: `1px solid ${atisaStyles.colors.accent}` }}
                    onClick={() => {
                      if (modoDeshabilitar === 'hitos') {
                        const ids = Array.from(new Set(getHitosFiltrados().map(h => h.hito_id)))
                        setSelectedHitosMaestro(new Set(ids))
                      } else {
                        // Seleccionar todos los procesos y sus hitos
                        const procesosIds = getProcesosFiltrados().map(p => p.id)
                        setSelectedProcesos(new Set(procesosIds))
                        const todosLosHitos = getHitosFiltrados().map(h => h.hito_id)
                        setSelectedHitosMaestro(new Set(todosLosHitos))
                      }
                    }}
                  >Seleccionar todos</button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      setSelectedHitosMaestro(new Set())
                      setSelectedProcesos(new Set())
                    }}
                  >Limpiar</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', maxHeight: 320, overflowY: 'auto' }}>
                  {modoDeshabilitar === 'hitos' ? (
                    // Lista de hitos
                    Array.from(new Set(getHitosFiltrados().map(h => `${h.hito_id}|${getNombreHito(h.hito_id)}`)))
                      .map(key => {
                        const [idStr, nombre] = key.split('|')
                        return { id: parseInt(idStr, 10), nombre }
                      })
                      .filter(item =>
                        item.nombre
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .includes(
                            busquedaHitosModal
                              .toLowerCase()
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '')
                              .trim()
                          )
                      )
                      .sort((a, b) => a.nombre.localeCompare(b.nombre))
                      .map(({ id, nombre }) => {
                        const checked = selectedHitosMaestro.has(id)
                        return (
                          <div
                            key={id}
                            onClick={() => {
                              setSelectedHitosMaestro(prev => {
                                const n = new Set(prev);
                                checked ? n.delete(id) : n.add(id);
                                return n
                              })
                              // Sincronizar procesos después de un pequeño delay para que el estado se actualice
                              setTimeout(() => {
                                sincronizarProcesosDesdeHitos()
                              }, 0)
                            }}
                            role="button"
                            className="d-flex align-items-center"
                            style={{
                              backgroundColor: checked ? '#e8f5e9' : 'white',
                              border: `2px solid ${checked ? atisaStyles.colors.accent : '#e9ecef'}`,
                              borderRadius: 10,
                              padding: '10px 12px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                              transition: 'all .2s ease'
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' }}
                            title={nombre}
                          >
                            <span
                              className="d-inline-flex justify-content-center align-items-center me-2"
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                backgroundColor: checked ? atisaStyles.colors.secondary : '#f1f3f5',
                                color: checked ? 'white' : atisaStyles.colors.primary,
                                border: `1px solid ${checked ? atisaStyles.colors.accent : '#e9ecef'}`,
                                fontSize: 12,
                                flexShrink: 0
                              }}
                            >
                              {checked ? '✓' : ''}
                            </span>
                            <span style={{ fontWeight: 600, color: atisaStyles.colors.primary, fontSize: 13, lineHeight: 1.2 }}>{nombre}</span>
                          </div>
                        )
                      })
                  ) : (
                    // Lista de procesos
                    getProcesosFiltrados()
                      .filter(proceso => {
                        const procesoNombre = procesosList.find(p => p.id === proceso.proceso_id)?.nombre || ''
                        return procesoNombre
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .includes(
                            busquedaProcesosModal
                              .toLowerCase()
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '')
                              .trim()
                          )
                      })
                      .sort((a, b) => {
                        const nombreA = procesosList.find(p => p.id === a.proceso_id)?.nombre || ''
                        const nombreB = procesosList.find(p => p.id === b.proceso_id)?.nombre || ''
                        return nombreA.localeCompare(nombreB)
                      })
                      .map(proceso => {
                        const procesoNombre = procesosList.find(p => p.id === proceso.proceso_id)?.nombre || ''
                        const checked = selectedProcesos.has(proceso.id)
                        return (
                          <div
                            key={proceso.id}
                            onClick={() => {
                              if (checked) {
                                // Deseleccionar proceso y sus hitos
                                setSelectedProcesos(prev => {
                                  const n = new Set(prev)
                                  n.delete(proceso.id)
                                  return n
                                })
                                // Remover todos los hitos de este proceso
                                const hitosDelProceso = getHitosFiltrados().filter(h => h.cliente_proceso_id === proceso.id)
                                setSelectedHitosMaestro(prev => {
                                  const n = new Set(prev)
                                  hitosDelProceso.forEach(h => n.delete(h.hito_id))
                                  return n
                                })
                              } else {
                                // Seleccionar proceso y todos sus hitos
                                setSelectedProcesos(prev => {
                                  const n = new Set(prev)
                                  n.add(proceso.id)
                                  return n
                                })
                                // Agregar todos los hitos de este proceso
                                const hitosDelProceso = getHitosFiltrados().filter(h => h.cliente_proceso_id === proceso.id)
                                setSelectedHitosMaestro(prev => {
                                  const n = new Set(prev)
                                  hitosDelProceso.forEach(h => n.add(h.hito_id))
                                  return n
                                })
                              }
                            }}
                            role="button"
                            className="d-flex align-items-center"
                            style={{
                              backgroundColor: checked ? '#e8f5e9' : 'white',
                              border: `2px solid ${checked ? atisaStyles.colors.accent : '#e9ecef'}`,
                              borderRadius: 10,
                              padding: '10px 12px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                              transition: 'all .2s ease'
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' }}
                            title={procesoNombre}
                          >
                            <span
                              className="d-inline-flex justify-content-center align-items-center me-2"
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                backgroundColor: checked ? atisaStyles.colors.secondary : '#f1f3f5',
                                color: checked ? 'white' : atisaStyles.colors.primary,
                                border: `1px solid ${checked ? atisaStyles.colors.accent : '#e9ecef'}`,
                                fontSize: 12,
                                flexShrink: 0
                              }}
                            >
                              {checked ? '✓' : ''}
                            </span>
                            <span style={{ fontWeight: 600, color: atisaStyles.colors.primary, fontSize: 13, lineHeight: 1.2 }}>{procesoNombre}</span>
                          </div>
                        )
                      })
                  )}
                </div>
                <p style={{ margin: '8px 0 0 0' }}>
                  {modoDeshabilitar === 'hitos'
                    ? 'Se deshabilitarán los hitos maestros seleccionados a partir de la fecha indicada.'
                    : 'Se deshabilitarán todos los hitos de los procesos seleccionados a partir de la fecha indicada.'
                  }
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeshabilitarDesdeModal(false)}>Cancelar</button>
                <button
                  className="btn btn-danger"
                  onClick={confirmarDeshabilitarDesde}
                  disabled={!fechaDesdeDeshabilitar || (modoDeshabilitar === 'hitos' ? selectedHitosMaestro.size === 0 : selectedProcesos.size === 0)}
                >
                  Deshabilitar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para habilitar/deshabilitar hito */}
      {showConfirmarHabilitarModal && hitoAConfirmar && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: atisaStyles.colors.primary, color: 'white' }}>
                <h5 className="modal-title" style={{ color: 'white' }}>
                  <i className={`bi ${isHitoHabilitado(hitoAConfirmar) ? 'bi-x-circle' : 'bi-check-circle'} me-2`}></i>
                  {isHitoHabilitado(hitoAConfirmar) ? 'Deshabilitar Hito' : 'Habilitar Hito'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={cancelarCambioEstado}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h6 style={{ color: atisaStyles.colors.primary, marginBottom: '8px' }}>
                    <i className="bi bi-info-circle me-2"></i>
                    Información del Hito
                  </h6>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Hito:</strong> {getNombreHito(hitoAConfirmar.hito_id)}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Proceso:</strong> {procesosList.find(p => p.id === procesos.find(cp => cp.id === hitoAConfirmar.cliente_proceso_id)?.proceso_id)?.nombre || 'Proceso desconocido'}
                    </div>
                    <div>
                      <strong>Estado actual:</strong>
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: isHitoHabilitado(hitoAConfirmar) ? '#d4edda' : '#f8d7da',
                        color: isHitoHabilitado(hitoAConfirmar) ? '#155724' : '#721c24',
                        border: `1px solid ${isHitoHabilitado(hitoAConfirmar) ? '#c3e6cb' : '#f5c6cb'}`
                      }}>
                        {isHitoHabilitado(hitoAConfirmar) ? '✓ Habilitado' : '✗ Deshabilitado'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="alert alert-warning" style={{ marginBottom: '0' }}>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>¿Está seguro?</strong>
                  {isHitoHabilitado(hitoAConfirmar)
                    ? ' Este hito será deshabilitado y no aparecerá en el calendario del cliente.'
                    : ' Este hito será habilitado y estará disponible en el calendario del cliente.'
                  }
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelarCambioEstado}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`btn ${isHitoHabilitado(hitoAConfirmar) ? 'btn-danger' : 'btn-success'}`}
                  onClick={confirmarCambioEstado}
                >
                  <i className={`bi ${isHitoHabilitado(hitoAConfirmar) ? 'bi-x-circle' : 'bi-check-circle'} me-2`}></i>
                  {isHitoHabilitado(hitoAConfirmar) ? 'Deshabilitar' : 'Habilitar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para cargar procesos */}
      {showCargarProcesosModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: atisaStyles.colors.primary, color: 'white' }}>
                <h5 className="modal-title" style={{ color: 'white' }}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Cargar Procesos al Calendario
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={cerrarModalCargarProcesos}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: '600', color: atisaStyles.colors.primary }}>
                    <i className="bi bi-search me-2"></i>
                    Buscar procesos
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Escriba para filtrar procesos..."
                    value={busquedaProcesos}
                    onChange={(e) => setBusquedaProcesos(e.target.value)}
                    style={{
                      fontFamily: atisaStyles.fonts.secondary,
                      border: `2px solid ${atisaStyles.colors.light}`,
                      borderRadius: '6px'
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: '600', color: atisaStyles.colors.primary }}>
                    <i className="bi bi-calendar-date me-2"></i>
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={fechaInicioProcesos}
                    onChange={(e) => setFechaInicioProcesos(e.target.value)}
                    required
                    style={{
                      fontFamily: atisaStyles.fonts.secondary,
                      border: `2px solid ${atisaStyles.colors.light}`,
                      borderRadius: '6px',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = atisaStyles.colors.accent
                      e.target.style.boxShadow = `0 0 0 3px rgba(0, 161, 222, 0.1)`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = atisaStyles.colors.light
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: '600', color: atisaStyles.colors.primary }}>
                    <i className="bi bi-funnel me-2"></i>
                    Filtrar por Temporalidad
                  </label>
                  <select
                    className="form-control"
                    value={filtroTemporalidad}
                    onChange={(e) => setFiltroTemporalidad(e.target.value)}
                    style={{
                      fontFamily: atisaStyles.fonts.secondary,
                      border: `2px solid ${atisaStyles.colors.light}`,
                      borderRadius: '6px',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = atisaStyles.colors.accent
                      e.target.style.boxShadow = `0 0 0 3px rgba(0, 161, 222, 0.1)`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = atisaStyles.colors.light
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    <option value="">Todas las temporalidades</option>
                    <option value="mes">Mensual</option>
                    <option value="trimestre">Trimestral</option>
                    <option value="semestre">Semestral</option>
                    <option value="año">Anual</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: '600', color: atisaStyles.colors.primary }}>
                    Procesos disponibles ({procesosDisponibles.filter(proceso => {
                      const coincideNombre = proceso.nombre.toLowerCase().includes(busquedaProcesos.toLowerCase())
                      const coincideTemporalidad = !filtroTemporalidad || proceso.temporalidad === filtroTemporalidad
                      return coincideNombre && coincideTemporalidad
                    }).length})
                  </label>
                  <div
                    style={{
                      maxHeight: '300px',
                      overflowY: 'auto',
                      border: `1px solid ${atisaStyles.colors.light}`,
                      borderRadius: '6px',
                      padding: '8px'
                    }}
                  >
                    {procesosDisponibles
                      .filter(proceso => {
                        const coincideNombre = proceso.nombre.toLowerCase().includes(busquedaProcesos.toLowerCase())
                        const coincideTemporalidad = !filtroTemporalidad || proceso.temporalidad === filtroTemporalidad
                        return coincideNombre && coincideTemporalidad
                      })
                      .map((proceso) => {
                        return (
                          <div
                            key={proceso.id}
                            className="d-flex align-items-center p-2"
                            style={{
                              borderBottom: '1px solid #f0f0f0',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s ease',
                              backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = atisaStyles.colors.light + '20'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleSeleccionProceso(proceso.id)
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={procesosSeleccionados.has(proceso.id)}
                              readOnly
                              style={{ marginRight: '12px' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontWeight: '600',
                                color: atisaStyles.colors.primary,
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap'
                              }}>
                                <span>{proceso.nombre}</span>
                                <span style={{
                                  fontSize: '11px',
                                  backgroundColor: atisaStyles.colors.accent,
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontWeight: '500',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  {proceso.temporalidad}
                                </span>
                              </div>
                              {proceso.descripcion && (
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                  {proceso.descripcion}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}

                    {procesosDisponibles.filter(proceso => {
                      const coincideNombre = proceso.nombre.toLowerCase().includes(busquedaProcesos.toLowerCase())
                      const coincideTemporalidad = !filtroTemporalidad || proceso.temporalidad === filtroTemporalidad
                      return coincideNombre && coincideTemporalidad
                    }).length === 0 && (
                        <div className="text-center py-4" style={{ color: '#666' }}>
                          <i className="bi bi-inbox fs-1"></i>
                          <p className="mt-2 mb-0">No hay procesos disponibles</p>
                        </div>
                      )}
                  </div>
                </div>

                {procesosSeleccionados.size > 0 && (
                  <div className="alert alert-info" style={{ marginBottom: '0' }}>
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>{procesosSeleccionados.size} proceso(s) seleccionado(s)</strong>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cerrarModalCargarProcesos}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    backgroundColor: atisaStyles.colors.accent,
                    color: 'white',
                    opacity: (procesosSeleccionados.size === 0 || !fechaInicioProcesos) ? 0.6 : 1
                  }}
                  onClick={cargarProcesosSeleccionados}
                  disabled={procesosSeleccionados.size === 0 || !fechaInicioProcesos}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Cargar {procesosSeleccionados.size > 0 ? `(${procesosSeleccionados.size})` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast */}
      <CustomToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message={toastMessage}
        type={toastType}
        delay={5000}
      />
    </>
  )
}

export default EditarCalendarioCliente
