import {FC, useState, useMemo, useEffect} from 'react'
import {Modal, Accordion} from 'react-bootstrap'
import {Cliente} from '../../../api/clientes'
import {ClienteProceso} from '../../../api/clienteProcesos'
import {Proceso} from '../../../api/procesos'
import { getClienteProcesoHitosByProceso, ClienteProcesoHito } from '../../../api/clienteProcesoHitos'
import { Hito, getAllHitos } from '../../../api/hitos'

interface Props {
  show: boolean
  onHide: () => void
  cliente: Cliente | null
  procesos: ClienteProceso[]
  procesosList: Proceso[]
}

const VerProcesosModal: FC<Props> = ({show, onHide, cliente, procesos, procesosList}) => {

  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [showHitosModal, setShowHitosModal] = useState(false)
  const [hitos, setHitos] = useState<ClienteProcesoHito[]>([])
  const [loadingHitos, setLoadingHitos] = useState(false)
  const [selectedProceso, setSelectedProceso] = useState<ClienteProceso | null>(null)
  const [hitosMaestro, setHitosMaestro] = useState<Hito[]>([])

  // Obtener períodos únicos
  const periodos = useMemo(() => {
    const uniquePeriods = new Set<string>();
    procesos.forEach(proceso => {
      if (proceso.anio && proceso.mes) {
        uniquePeriods.add(`${proceso.anio}-${proceso.mes.toString().padStart(2, '0')}`);
      }
    });
    return Array.from(uniquePeriods)
      .sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        if (yearA !== yearB) return yearB - yearA;
        return monthA - monthB;
      });
  }, [procesos]);

  // Establecer el primer período disponible cuando se abre el modal
  useEffect(() => {
    if (show && periodos.length > 0) {
      // Seleccionar automáticamente el primer período
      setSelectedPeriod(periodos[0]);
    }
  }, [show, periodos]);

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

      // Usar padStart para el mes
      const mes = proceso.mes?.toString().padStart(2, '0');
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

    // Ordenar períodos por año descendente y mes ascendente, y las fechas ascendentes
    Object.keys(groups).forEach(key => {
      // Ordenar las fechas dentro de cada período
      Object.values(groups[key].periodos).forEach(periodo => {
        periodo.items.sort((a, b) =>
          new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
        )
      })

      // Ordenar los períodos
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
    if (showHitosModal) {
      // Cargar hitos maestros para mostrar nombres
      getAllHitos().then((res) => setHitosMaestro(res.hitos || []))
    }
  }, [showHitosModal])

  const handleVerHitos = async (proceso: ClienteProceso) => {
    setSelectedProceso(proceso)
    setLoadingHitos(true)
    setShowHitosModal(true)
    try {
      const hitosData = await getClienteProcesoHitosByProceso(proceso.id)
      setHitos(hitosData)
    } catch (e) {
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
    <>
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Procesos de {cliente?.razsoc}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4 position-relative">
            <div className="d-flex gap-2 overflow-auto pb-2 justify-content-end" style={{ scrollbarWidth: 'thin' }}>
              {periodos.map((periodo) => {
                const [year, month] = periodo.split('-');
                return (
                  <button
                    key={periodo}
                    className={`btn btn-sm ${selectedPeriod === periodo ? 'btn-primary' : 'btn-light-primary'}`}
                    onClick={() => setSelectedPeriod(periodo)}
                  >
                    {getMesName(parseInt(month))} {year}
                  </button>
                );
              })}
            </div>
          </div>

          <Accordion defaultActiveKey="0">
            {Object.entries(groupedProcesos).map(([nombreProceso, grupo], index) => {
              const procesosFiltradosPorPeriodo = selectedPeriod
                ? Object.entries(grupo.periodos).filter(([key]) => key === selectedPeriod)
                : Object.entries(grupo.periodos);

              if (procesosFiltradosPorPeriodo.length === 0) return null;

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
              );
            })}
          </Accordion>
        </Modal.Body>
      </Modal>
      <Modal show={showHitosModal} onHide={() => setShowHitosModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Hitos del proceso</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
        </Modal.Body>
      </Modal>
    </>
  )
}

export default VerProcesosModal
