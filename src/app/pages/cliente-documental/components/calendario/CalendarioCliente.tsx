import { FC, useEffect, useMemo, useState } from 'react'
import { Accordion } from 'react-bootstrap'
import { Cliente, getClienteById } from '../../../../api/clientes'
import { ClienteProceso, getClienteProcesosByCliente } from '../../../../api/clienteProcesos'
import { Proceso, getAllProcesos } from '../../../../api/procesos'
import { getClienteProcesoHitosByProceso, ClienteProcesoHito } from '../../../../api/clienteProcesoHitos'
import { Hito, getAllHitos } from '../../../../api/hitos'
import { getClienteProcesoHitoCumplimientosByHito, ClienteProcesoHitoCumplimiento } from '../../../../api/clienteProcesoHitoCumplimientos'
import CumplimentarHitoModal from './CumplimentarHitoModal'

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

      // Organizar hitos por proceso y ordenar por fecha de inicio
      resultados.forEach(({ procesoId, hitos }) => {
        hitosMap[procesoId] = hitos.sort((a, b) =>
          new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
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

  // Agrupar procesos por tipo y subgrupar por período
  const groupedProcesos = useMemo(() => {
    const groups = procesos.reduce((acc, proceso) => {
      const procesoInfo = procesosList.find(p => p.id === proceso.id_proceso)
      const key = procesoInfo?.nombre || `Proceso ${proceso.id_proceso}`
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
    <div className="container py-5">
      <h2 className="mb-4 text-center">Calendario {cliente?.razsoc || clienteId}</h2>
      <div className="mb-4 position-relative">
        <div className="d-flex gap-2 overflow-auto pb-2 justify-content-end" style={{ scrollbarWidth: 'thin' }}>
          {periodos.map((periodo) => {
            const [year, month] = periodo.split('-')
            return (
              <button
                key={periodo}
                className={`btn btn-sm ${selectedPeriod === periodo ? 'btn-primary' : 'btn-light-primary'}`}
                onClick={() => setSelectedPeriod(periodo)}
              >
                {getMesName(parseInt(month))} {year}
              </button>
            )
          })}
        </div>
      </div>
      <Accordion defaultActiveKey="0">
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
            <Accordion.Item key={nombreProceso} eventKey={index.toString()}>
              <Accordion.Header>
                <div className='d-flex justify-content-between w-100 me-3'>
                  <span>{nombreProceso}</span>
                  <span className='badge badge-light-primary'>
                    {totalHitos} hitos
                  </span>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                {procesosFiltradosPorPeriodo.map(([periodoKey, periodo]) => (
                  <div key={periodoKey} className='mb-5'>
                    <div className='table-responsive'>
                      <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4 mb-0'>
                        <thead>
                          <tr className='text-start text-muted fw-bold fs-7 text-uppercase gs-0'>
                            <th>Hito</th>
                            <th>Estado</th>
                            <th>Fecha Actualización</th>
                            <th>Fecha Inicio</th>
                            <th>Fecha Límite</th>
                            <th>Hora Límite</th>
                            <th>Responsable</th>
                            <th>Fecha Cumplimiento</th>
                            <th className='text-end'>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingHitos ? (
                            <tr>
                              <td colSpan={9} className="text-center py-4">
                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                  <span className="visually-hidden">Cargando hitos...</span>
                                </div>
                                <span className="ms-2">Cargando hitos...</span>
                              </td>
                            </tr>
                          ) : (
                            periodo.items.map((proceso) => {
                              const hitosDelProceso = hitosPorProceso[proceso.id] || []

                              if (hitosDelProceso.length === 0) {
                                return (
                                  <tr key={proceso.id}>
                                    <td className="fw-bold text-gray-800">{formatDate(proceso.fecha_inicio)}</td>
                                    <td colSpan={8} className="text-muted text-center py-3">
                                      No hay hitos para este proceso
                                    </td>
                                  </tr>
                                )
                              }

                              return hitosDelProceso.map((hito, hitoIndex) => {
                                const isFinalized = hito.estado === 'Finalizado'
                                const isFirstHito = hitoIndex === 0

                                return (
                                  <tr key={`${proceso.id}-${hito.id}`}>
                                    <td>{getNombreHito(hito.hito_id)}</td>
                                    <td>
                                      <span className={`badge ${isFinalized ? 'badge-success' : 'badge-primary'}`}>
                                        {hito.estado}
                                      </span>
                                    </td>
                                    <td>{hito.fecha_estado ? formatDateWithTime(hito.fecha_estado) : '-'}</td>
                                    <td>{formatDate(hito.fecha_inicio)}</td>
                                    <td>{hito.fecha_fin ? formatDate(hito.fecha_fin ?? null) : '-'}</td>
                                    <td>{hito.hora_limite ? formatTime(hito.hora_limite) : '-'}</td>
                                    <td>{hito.tipo}</td>
                                    <td>{getUltimaFechaCumplimiento(hito.id)}</td>
                                    <td className='text-end'>
                                      <button
                                        className={`btn btn-sm ${isFinalized ? 'btn-light-secondary' : 'btn-light-primary'}`}
                                        onClick={() => {
                                          if (!isFinalized) {
                                            setHitoSeleccionado(hito)
                                            setShowCumplimentarHito(true)
                                          }
                                        }}
                                        disabled={isFinalized}
                                        title={isFinalized ? "Proceso finalizado - No se pueden subir documentos" : "Insertar documento"}
                                      >
                                        <i className="bi bi-upload"></i> {isFinalized ? 'Finalizado' : 'Cumplimentar'}
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
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Observación</h5>
                <button type="button" className="btn-close" onClick={() => setShowObservacionModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>{observacionSeleccionada}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarioCliente
