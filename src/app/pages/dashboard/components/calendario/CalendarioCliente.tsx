import { FC, useEffect, useMemo, useState } from 'react'
import { Accordion } from 'react-bootstrap'
import { Cliente, getClienteById } from '../../../../api/clientes'
import { ClienteProceso, getClienteProcesosByCliente } from '../../../../api/clienteProcesos'
import { Proceso, getAllProcesos } from '../../../../api/procesos'
import { getClienteProcesoHitosByProceso, ClienteProcesoHito } from '../../../../api/clienteProcesoHitos'
import { Hito, getAllHitos } from '../../../../api/hitos'
import SubirDocumentoModal from './SubirDocumentoModal'

interface Props {
  clienteId: string
}

const CalendarioCliente: FC<Props> = ({ clienteId }) => {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [procesos, setProcesos] = useState<ClienteProceso[]>([])
  const [procesosList, setProcesosList] = useState<Proceso[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [showHitos, setShowHitos] = useState(false)
  const [hitos, setHitos] = useState<ClienteProcesoHito[]>([])
  const [loadingHitos, setLoadingHitos] = useState(false)
  const [selectedProceso, setSelectedProceso] = useState<ClienteProceso | null>(null)
  const [hitosMaestro, setHitosMaestro] = useState<Hito[]>([])
  const [showSubirDocumento, setShowSubirDocumento] = useState(false)
  const [hitoSeleccionado, setHitoSeleccionado] = useState<ClienteProcesoHito | null>(null)
  const [hitosContadores, setHitosContadores] = useState<Record<number, { nuevos: number, finalizados: number }>>({})
  const [loadingContadores, setLoadingContadores] = useState(false)

  useEffect(() => {
    getClienteById(clienteId).then(setCliente)
    getClienteProcesosByCliente(clienteId).then(res => setProcesos(res.clienteProcesos || []))
    getAllProcesos().then(res => setProcesosList(res.procesos || []))
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
    if (periodos.length > 0) setSelectedPeriod(periodos[0])
  }, [periodos])

  // Función para cargar contadores de hitos
  const cargarContadoresHitos = async (procesosAConta: ClienteProceso[]) => {
    if (procesosAConta.length === 0) {
      setHitosContadores({})
      return
    }

    setLoadingContadores(true)
    const contadores: Record<number, { nuevos: number, finalizados: number }> = {}

    try {
      // Cargar hitos para todos los procesos en paralelo
      const hitosPromises = procesosAConta.map(proceso =>
        getClienteProcesoHitosByProceso(proceso.id)
          .then(hitosData => ({ procesoId: proceso.id, hitos: hitosData }))
          .catch(() => ({ procesoId: proceso.id, hitos: [] }))
      )

      const resultados = await Promise.all(hitosPromises)

      // Contar hitos por estado para cada proceso
      resultados.forEach(({ procesoId, hitos }) => {
        contadores[procesoId] = {
          nuevos: hitos.filter(h => h.estado === 'Nuevo').length,
          finalizados: hitos.filter(h => h.estado === 'Finalizado').length
        }
      })

      setHitosContadores(contadores)
    } catch (error) {
      console.error('Error cargando contadores de hitos:', error)
      setHitosContadores({})
    }

    setLoadingContadores(false)
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

  // Cargar contadores cuando cambien los procesos filtrados por período
  useEffect(() => {
    if (selectedPeriod && Object.keys(groupedProcesos).length > 0) {
      const procesosVisibles: ClienteProceso[] = []
      Object.values(groupedProcesos).forEach(grupo => {
        const periodoData = grupo.periodos[selectedPeriod]
        if (periodoData) {
          procesosVisibles.push(...periodoData.items)
        }
      })
      cargarContadoresHitos(procesosVisibles)
    }
  }, [selectedPeriod, groupedProcesos])

  const getMesName = (mes: number) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return meses[mes - 1] || '-'
  }

  useEffect(() => {
    if (showHitos) {
      getAllHitos().then((res) => setHitosMaestro(res.hitos || []))
    }
  }, [showHitos])

  const handleVerHitos = async (proceso: ClienteProceso) => {
    setSelectedProceso(proceso)
    setLoadingHitos(true)
    setShowHitos(true)
    try {
      const hitosData = await getClienteProcesoHitosByProceso(proceso.id)
      setHitos(hitosData)
    } catch {
      setHitos([])
    }
    setLoadingHitos(false)
  }

  const getNombreHito = (hito_id: number) => {
    const hito = hitosMaestro.find(h => h.id === hito_id)
    return hito ? hito.nombre : `Hito ${hito_id}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateWithTime = (date: string) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Recargar hitos después de subir documento
  const handleUploadSuccess = async () => {
    if (selectedProceso) {
      setLoadingHitos(true)
      try {
        const hitosData = await getClienteProcesoHitosByProceso(selectedProceso.id)
        setHitos(hitosData)
      } catch {
        setHitos([])
      }
      setLoadingHitos(false)

      // También recargar contadores
      if (selectedPeriod && Object.keys(groupedProcesos).length > 0) {
        const procesosVisibles: ClienteProceso[] = []
        Object.values(groupedProcesos).forEach(grupo => {
          const periodoData = grupo.periodos[selectedPeriod]
          if (periodoData) {
            procesosVisibles.push(...periodoData.items)
          }
        })
        cargarContadoresHitos(procesosVisibles)
      }
    }

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
          return (
            <Accordion.Item key={nombreProceso} eventKey={index.toString()}>
              <Accordion.Header>
                <div className='d-flex justify-content-between w-100 me-3'>
                  <span>{nombreProceso}</span>
                  <span className='badge badge-light-primary'>
                    {procesosFiltradosPorPeriodo.reduce((total, [, periodo]) => total + periodo.items.length, 0)}
                  </span>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                {procesosFiltradosPorPeriodo.map(([periodoKey, periodo]) => (
                  <div key={periodoKey} className='mb-5'>
                    <h3 className='fs-5 text-gray-800 mb-3'>
                      {getMesName(periodo.mes || 0)} {periodo.anio || '-'}
                    </h3>
                    <div className='table-responsive'>
                      <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4 mb-0'>
                        <thead>
                          <tr className='text-start text-muted fw-bold fs-7 text-uppercase gs-0'>
                            <th>Fecha Inicio</th>
                            <th className='text-center'>Hitos Pendientes</th>
                            <th className='text-center'>Hitos Finalizados</th>
                            <th className='text-end'>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodo.items.map((proceso) => {
                            const contadores = hitosContadores[proceso.id] || { nuevos: 0, finalizados: 0 }
                            return (
                              <tr key={proceso.id}>
                                <td>{formatDate(proceso.fecha_inicio)}</td>
                                <td className='text-center'>
                                  {loadingContadores ? (
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                      <span className="visually-hidden">Cargando...</span>
                                    </div>
                                  ) : (
                                    <span className='badge badge-light-info'>{contadores.nuevos}</span>
                                  )}
                                </td>
                                <td className='text-center'>
                                  {loadingContadores ? (
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                      <span className="visually-hidden">Cargando...</span>
                                    </div>
                                  ) : (
                                    <span className='badge badge-light-success'>{contadores.finalizados}</span>
                                  )}
                                </td>
                                <td className='text-end'>
                                  <button
                                    className='btn btn-sm btn-icon btn-light-primary'
                                    onClick={() => handleVerHitos(proceso)}
                                    title='Ver Calendario'
                                  >
                                    <i className='bi bi-calendar fs-5'></i>
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
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
      {/* Modal-like tabla de hitos */}
      {showHitos && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Hitos del proceso</h5>
                <button type="button" className="btn-close" onClick={() => setShowHitos(false)}></button>
              </div>
              <div className="modal-body">
                {loadingHitos ? (
                  <div className="text-center py-4">Cargando hitos...</div>
                ) : hitos.length === 0 ? (
                  <div className="text-center py-4">No hay hitos para este proceso.</div>
                ) : (
                  <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4 mb-0">
                    <thead>
                      <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                        <th>Hito</th>
                        <th>Estado</th>
                        <th>Fecha Estado</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hitos.map(hito => {
                        const isFinalized = hito.estado === 'Finalizado'
                        return (
                          <tr key={hito.id}>
                            <td>{getNombreHito(hito.hito_id)}</td>
                            <td>
                              <span className={`badge ${isFinalized ? 'badge-light-success' : 'badge-light-warning'}`}>
                                {hito.estado}
                              </span>
                            </td>
                            <td>{hito.fecha_estado ? formatDateWithTime(hito.fecha_estado) : '-'}</td>
                            <td>{formatDate(hito.fecha_inicio)}</td>
                            <td>{hito.fecha_fin ? formatDate(hito.fecha_fin) : '-'}</td>
                            <td>
                              <button
                                className={`btn btn-sm ${isFinalized ? 'btn-light-secondary' : 'btn-light-primary'}`}
                                onClick={() => {
                                  if (!isFinalized) {
                                    setHitoSeleccionado(hito)
                                    setShowSubirDocumento(true)
                                  }
                                }}
                                disabled={isFinalized}
                                title={isFinalized ? "Proceso finalizado - No se pueden subir documentos" : "Insertar documento"}
                              >
                                <i className="bi bi-upload"></i> {isFinalized ? 'Finalizado' : 'Cumplimentar hito'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal para subir documento */}
      {hitoSeleccionado && (
        <SubirDocumentoModal
          show={showSubirDocumento}
          onHide={() => setShowSubirDocumento(false)}
          idClienteProcesoHito={hitoSeleccionado.id}
          nombreDocumento={getNombreHito(hitoSeleccionado.hito_id)}
          estado={hitoSeleccionado.estado}
          onUploadSuccess={() => {
            setShowSubirDocumento(false)
            handleUploadSuccess()
          }}
        />
      )}
    </div>
  )
}

export default CalendarioCliente
