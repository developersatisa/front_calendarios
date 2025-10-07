import { FC, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Accordion, Modal, Toast, ToastContainer } from 'react-bootstrap'
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
  const [vistaCalendario, setVistaCalendario] = useState(false)

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
      alert('La fecha límite es obligatoria y no se puede dejar vacía')
      const lastValue = (hitosEditados[hitoId]?.fecha_limite || hitoOriginal.fecha_limite || '')
      const inputElement = document.querySelector(`input[data-hito-id="${hitoId}"][data-campo="${campo}"]`) as HTMLInputElement
      if (inputElement) {
        inputElement.value = formatDateForInput(lastValue)
      }
      return
    }
    const valorFinal = valor

    // Validar que la fecha seleccionada permanezca dentro del mes seleccionado
    if (valorFinal && !isWithinSelectedMonth(valorFinal)) {
      alert('La fecha debe estar dentro del mes asignado (período seleccionado)')
      // Restablecer el valor del input al valor anterior
      const inputElement = document.querySelector(`input[data-hito-id="${hitoId}"][data-campo="${campo}"]`) as HTMLInputElement
      if (inputElement) {
        inputElement.value = formatDateForInput(valorAnterior)
      }
      return
    }

    // No hay validación entre inicio y fin, solo validación de mes

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
      setObservacionesGlobales('')
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

    alert(`Resumen de cambios:\n\n${resumen}${observacionesTexto}`)
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

      // Recargar hitos
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

    // Filtro por estado eliminado

    if (filtroProceso) {
      hitosFiltrados = hitosFiltrados.filter(hito => {
        const proceso = procesos.find(p => p.id === hito.cliente_proceso_id)
        return proceso?.proceso_id === parseInt(filtroProceso)
      })
    }

    // Filtro por nombre de hito (ignora mayúsculas y tildes)
    if (busquedaNombre.trim() !== '') {
      const normalizeText = (text: string) =>
        text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
      const termino = normalizeText(busquedaNombre)
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
                    padding: '1rem',
                    backgroundColor: atisaStyles.colors.light,
                    borderRadius: '8px'
                  }}
                >
                  <h3
                    style={{
                      fontFamily: atisaStyles.fonts.primary,
                      color: atisaStyles.colors.primary,
                      fontWeight: 'bold',
                      margin: 0,
                      fontSize: '1.5rem'
                    }}
                  >
                    {selectedPeriod ? `${getMesName(parseInt(selectedPeriod.split('-')[1]))} ${selectedPeriod.split('-')[0]}` : 'Seleccione un período'}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setVistaCalendario(false)}
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        fontSize: '12px'
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
                                  className={`hito-card ${hito.estado.toLowerCase()}`}
                                  onClick={() => editarHito(hito)}
                                  style={{
                                    backgroundColor: hito.estado === 'Finalizado' ? atisaStyles.colors.secondary : atisaStyles.colors.accent,
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
                    borderRadius: '8px'
                  }}
                >
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
                  <div className="table-actions" style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setVistaCalendario(true)}
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        fontSize: '12px'
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
                    <div style={{ flex: 1 }}>
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
                          borderRadius: '6px'
                        }}
                      />
                    </div>
                  </div>
                  <table
                    className="hitos-table"
                    style={{
                      width: '100%',
                      minWidth: '1200px', // Ancho mínimo para aprovechar el espacio
                      borderCollapse: 'collapse',
                      fontFamily: atisaStyles.fonts.secondary
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: atisaStyles.colors.primary, color: 'white' }}>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', fontSize: '15px', minWidth: '200px' }}>
                          Hito
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', fontSize: '15px', minWidth: '180px' }}>
                          Proceso
                        </th>

                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', fontSize: '15px', minWidth: '150px' }}>
                          Fecha Límite
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', fontSize: '15px', minWidth: '120px' }}>
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
                          const isFinalized = false

                          return (
                            <tr
                              key={hito.id}
                              style={{
                                backgroundColor: hasChanges ? '#fff3cd' : (index % 2 === 0 ? 'white' : '#f8f9fa'),
                                transition: 'all 0.2s ease',
                                borderLeft: hasChanges ? `4px solid ${atisaStyles.colors.warning}` : 'none'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = hasChanges ? '#ffeaa7' : atisaStyles.colors.light
                                e.currentTarget.style.transform = 'translateY(-1px)'
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 80, 92, 0.1)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = hasChanges ? '#fff3cd' : (index % 2 === 0 ? 'white' : '#f8f9fa')
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'none'
                              }}
                            >
                              <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                <div
                                  className="hito-info"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                >
                                  <span
                                    style={{
                                      fontFamily: atisaStyles.fonts.secondary,
                                      color: atisaStyles.colors.primary,
                                      fontWeight: '600',
                                      fontSize: '15px',
                                      lineHeight: '1.4'
                                    }}
                                  >
                                    {getNombreHito(hito.hito_id)}
                                  </span>
                                  {hasChanges && (
                                    <i className="bi bi-pencil-square" style={{ color: '#ffc107' }}></i>
                                  )}

                                </div>
                              </td>
                              <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                <span
                                  style={{
                                    fontFamily: atisaStyles.fonts.secondary,
                                    color: atisaStyles.colors.dark,
                                    fontSize: '14px',
                                    backgroundColor: atisaStyles.colors.light,
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    display: 'inline-block',
                                    fontWeight: '500'
                                  }}
                                >
                                  {getNombreProceso(hito.cliente_proceso_id)}
                                </span>
                              </td>

                              <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={formatDateForInput(getValorHito(hito, 'fecha_limite'))}
                                    onChange={(e) => handleFechaChange(hito.id, 'fecha_limite', e.target.value)}
                                    data-hito-id={hito.id}
                                    data-campo="fecha_limite"
                                    min={getSelectedMonthBounds() ? formatDateInputFromDate(getSelectedMonthBounds()!.start) : undefined}
                                    max={getSelectedMonthBounds() ? formatDateInputFromDate(getSelectedMonthBounds()!.end) : undefined}
                                    style={{
                                      fontFamily: atisaStyles.fonts.secondary,
                                      fontSize: '14px',
                                      border: hasChanges ? `2px solid ${atisaStyles.colors.warning}` : `1px solid ${atisaStyles.colors.light}`,
                                      borderRadius: '6px',
                                      flex: 1
                                    }}
                                  />
                                </div>
                              </td>
                              <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                <input
                                  type="time"
                                  className="form-control form-control-sm"
                                  value={formatTimeForInput(getValorHito(hito, 'hora_limite'))}
                                  onChange={(e) => handleHoraChange(hito.id, e.target.value)}

                                  style={{
                                    fontFamily: atisaStyles.fonts.secondary,
                                    fontSize: '14px',
                                    border: hasChanges ? `2px solid ${atisaStyles.colors.warning}` : `1px solid ${atisaStyles.colors.light}`,
                                    borderRadius: '6px'
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


        {/* Modal de edición de hito */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title
              style={{
                fontFamily: atisaStyles.fonts.primary,
                color: atisaStyles.colors.primary,
                fontWeight: 'bold'
              }}
            >
              <i className="bi bi-pencil-square me-2" style={{ color: atisaStyles.colors.primary }}></i>
              Editar Hito: {selectedHito ? getNombreHito(selectedHito.hito_id) : ''}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="hito-edit-form">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label" style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: atisaStyles.colors.dark,
                      marginBottom: '8px'
                    }}>
                      Fecha Límite
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={editForm.fecha_limite || ''}
                      onChange={(e) => {
                        const newVal = e.target.value || ''
                        if (!newVal) {
                          alert('La fecha límite es obligatoria y no se puede dejar vacía')
                          e.target.value = editForm.fecha_limite || ''
                          return
                        }
                        if (newVal && !isWithinSelectedMonth(newVal)) {
                          alert('La fecha debe estar dentro del mes asignado (período seleccionado)')
                          // Restablecer al valor anterior
                          e.target.value = editForm.fecha_limite || ''
                          return
                        }
                        setEditForm({ ...editForm, fecha_limite: newVal })
                      }}
                      min={getSelectedMonthBounds() ? formatDateInputFromDate(getSelectedMonthBounds()!.start) : undefined}
                      max={getSelectedMonthBounds() ? formatDateInputFromDate(getSelectedMonthBounds()!.end) : undefined}
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        fontSize: '14px',
                        border: `1px solid ${atisaStyles.colors.light}`,
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                </div>

              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label" style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: atisaStyles.colors.dark,
                      marginBottom: '8px'
                    }}>
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
                        border: `1px solid ${atisaStyles.colors.light}`,
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label" style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: atisaStyles.colors.dark,
                      marginBottom: '8px'
                    }}>
                      Estado
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedHito?.estado || ''}
                      disabled
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        fontSize: '14px',
                        border: `1px solid ${atisaStyles.colors.light}`,
                        borderRadius: '6px',
                        backgroundColor: '#f8f9fa'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label" style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: atisaStyles.colors.dark,
                  marginBottom: '8px'
                }}>
                  Observaciones
                </label>
                <textarea
                  className="form-control"
                  value={editForm.observaciones}
                  onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })}
                  rows={3}
                  placeholder="Agregue observaciones sobre los cambios realizados..."
                  style={{
                    fontFamily: atisaStyles.fonts.secondary,
                    fontSize: '14px',
                    border: `1px solid ${atisaStyles.colors.light}`,
                    borderRadius: '6px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              className="btn btn-secondary"
              onClick={() => setShowEditModal(false)}
              style={{
                fontFamily: atisaStyles.fonts.secondary,
                fontSize: '14px',
                padding: '8px 16px'
              }}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={guardarHito}
              style={{
                fontFamily: atisaStyles.fonts.secondary,
                fontSize: '14px',
                padding: '8px 16px',
                backgroundColor: atisaStyles.colors.secondary,
                borderColor: atisaStyles.colors.secondary
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
        <ToastContainer position="top-end" style={{ zIndex: 9999 }}>
          <Toast show={showSuccess} onClose={() => setShowSuccess(false)} delay={3000} autohide>
            <Toast.Header>
              <i className="bi bi-check-circle text-success me-2"></i>
              <strong className="me-auto">Éxito</strong>
            </Toast.Header>
            <Toast.Body>
              Los cambios se han guardado correctamente
            </Toast.Body>
          </Toast>

          <Toast show={showError} onClose={() => setShowError(false)} delay={5000} autohide>
            <Toast.Header>
              <i className="bi bi-exclamation-triangle text-danger me-2"></i>
              <strong className="me-auto">Error</strong>
            </Toast.Header>
            <Toast.Body>
              {errorMessage || 'Ha ocurrido un error al guardar los cambios'}
            </Toast.Body>
          </Toast>
        </ToastContainer>
      </div>
    </>
  )
}

export default EditarCalendarioCliente
