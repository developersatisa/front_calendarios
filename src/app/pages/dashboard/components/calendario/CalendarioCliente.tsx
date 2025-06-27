import { FC, useEffect, useMemo, useState } from 'react'
import { Accordion } from 'react-bootstrap'
import { Cliente, getClienteById } from '../../../../api/clientes'
import { ClienteProceso, getClienteProcesosByCliente } from '../../../../api/clienteProcesos'
import { Proceso, getAllProcesos } from '../../../../api/procesos'
import { getClienteProcesoHitosByProceso, ClienteProcesoHito } from '../../../../api/clienteProcesoHitos'
import { Hito, getAllHitos } from '../../../../api/hitos'

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

  return (
    <div className="container py-5">
      <h2 className="mb-4">Procesos de {cliente?.razsoc || clienteId}</h2>
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
                            <th className='text-end'>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodo.items.map((proceso) => (
                            <tr key={proceso.id}>
                              <td>{formatDate(proceso.fecha_inicio)}</td>
                              <td className='text-end'>
                                <button
                                  className='btn btn-sm btn-icon btn-light-primary'
                                  onClick={() => handleVerHitos(proceso)}
                                  title='Ver hitos'
                                >
                                  <i className='bi bi-list-check fs-5'></i>
                                </button>
                              </td>
                            </tr>
                          ))}
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
                        <th>Nombre Hito</th>
                        <th>Estado</th>
                        <th>Fecha Estado</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hitos.map(hito => (
                        <tr key={hito.id}>
                          <td>{getNombreHito(hito.hito_id)}</td>
                          <td>{hito.estado}</td>
                          <td>{hito.fecha_estado ? formatDate(hito.fecha_estado) : '-'}</td>
                          <td>{formatDate(hito.fecha_inicio)}</td>
                          <td>{hito.fecha_fin ? formatDate(hito.fecha_fin) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarioCliente
