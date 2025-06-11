import {FC, useState, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {KTCard, KTCardBody, KTSVG} from '../../../_metronic/helpers'
import ProcesoModal from './components/ProcesoModal'
import ProcesoHitosMaestroModal from './components/ProcesoHitosMaestroModal'
import {Proceso, getAllProcesos, createProceso, updateProceso, deleteProceso} from '../../api/procesos'
import {ProcesoHitos, getAllProcesoHitosMaestro, createProcesoHitosMaestro, deleteProcesoHitosMaestro} from '../../api/procesoHitosMaestro'
import {Hito, getAllHitos} from '../../api/hitos'
import {getPageNumbers} from '../../utils/pagination'
import SharedPagination from '../../components/pagination/SharedPagination'

const ProcesosList: FC = () => {
  const navigate = useNavigate()
  const [procesos, setProcesos] = useState<Proceso[]>([])
  const [procesoEditando, setProcesoEditando] = useState<Proceso | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10
  const [searchTerm, setSearchTerm] = useState('')
  const [hitos, setHitos] = useState<Hito[]>([])
  const [procesoHitos, setProcesoHitos] = useState<ProcesoHitos[]>([])
  const [showHitosModal, setShowHitosModal] = useState(false)
  const [selectedProcesoForHitos, setSelectedProcesoForHitos] = useState<Proceso | null>(null)

  useEffect(() => {
    loadAll()
  }, [page])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [procesosData, hitosData, procesoHitosData] = await Promise.all([
        getAllProcesos(page, limit),
        getAllHitos(),
        getAllProcesoHitosMaestro()
      ])
      setProcesos(procesosData.procesos)
      setTotal(procesosData.total)
      setHitos(hitosData.hitos || [])
      setProcesoHitos(procesoHitosData.ProcesoHitos || [])
    } catch (error) {
      setError('Error al cargar los datos')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProceso = async (procesoData: Omit<Proceso, 'id'>) => {
    try {
      if (procesoEditando) {
        const updatedProceso = await updateProceso(procesoEditando.id, procesoData)
        setProcesos(procesos.map((p) => (p.id === procesoEditando.id ? updatedProceso : p)))
      } else {
        const newProceso = await createProceso(procesoData)
        setProcesos([...procesos, newProceso])
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar el proceso:', error)
    }
  }

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este proceso?')) {
      try {
        await deleteProceso(id)
        loadAll()
      } catch (error) {
        console.error('Error al eliminar:', error)
        // Implementar manejo de errores
      }
    }
  }

  const handleCrear = () => {
    setProcesoEditando(null)
    setShowModal(true)
  }

  const handleEditar = (proceso: Proceso) => {
    setProcesoEditando(proceso)
    setShowModal(true)
  }

  const handleSaveHitos = async (newRelations: Omit<ProcesoHitos, 'id'>[]) => {
    try {
      const promises = newRelations.map(relation => createProcesoHitosMaestro(relation))
      await Promise.all(promises)
      loadAll()
      setShowHitosModal(false)
    } catch (error) {
      console.error('Error al guardar hitos:', error)
    }
  }

  const handleDeleteHito = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este hito del proceso?')) {
      try {
        await deleteProcesoHitosMaestro(id)
        loadAll()
      } catch (error) {
        console.error('Error al eliminar:', error)
      }
    }
  }

  const filteredProcesos = procesos.filter((proceso) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()

    return Object.values(proceso).some(value =>
      value?.toString().toLowerCase().includes(searchLower)
    )
  })

  const groupedProcesoHitos = procesoHitos.reduce((groups, ph) => {
    if (!groups[ph.id_proceso]) {
      groups[ph.id_proceso] = []
    }
    const hito = hitos.find(h => h.id === ph.id_hito)
    if (hito) {
      groups[ph.id_proceso].push({...ph, hitoData: hito})
    }
    return groups
  }, {} as Record<number, Array<ProcesoHitos & {hitoData: Hito}>>)

  const handleAddHitos = (proceso: Proceso) => {
    // Filtrar los hitos actuales del proceso seleccionado
    const hitosActualesProceso = procesoHitos.filter(ph => ph.id_proceso === proceso.id)
    setSelectedProcesoForHitos(proceso)
    setShowHitosModal(true)
  }

  return (
    <KTCard>
      <div className='card-header border-0 pt-6'>
        <div className='card-title'>
          <div className='d-flex align-items-center position-relative my-1'>
            <KTSVG
              path='/media/icons/duotune/general/gen021.svg'
              className='svg-icon-1 position-absolute ms-6'
            />
            <input
              type='text'
              className='form-control form-control-solid w-250px ps-14'
              placeholder='Buscar proceso'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className='card-toolbar'>
          <div className='d-flex justify-content-end gap-2'>
            <button
              type='button'
              className='btn btn-light'
              onClick={() => navigate('/dashboard')}
            >
              <KTSVG
                path='/media/icons/duotune/arrows/arr063.svg'
                className='svg-icon-2'
              />
              Volver
            </button>
            <button
              type='button'
              className='btn btn-primary'
              onClick={handleCrear}
            >
              <KTSVG
                path='/media/icons/duotune/arrows/arr075.svg'
                className='svg-icon-2'
              />
              Añadir Proceso
            </button>
          </div>
        </div>
      </div>
      <KTCardBody className='py-4'>
        {loading ? (
          <div className='d-flex justify-content-center'>
            <div className='spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Cargando...</span>
            </div>
          </div>
        ) : error ? (
          <div className='alert alert-danger'>{error}</div>
        ) : (
          <>
            <div className='table-responsive'>
              <table className='table align-middle table-row-dashed fs-6 gy-5'>
                <thead>
                  <tr className='text-start text-muted fw-bold fs-7 text-uppercase gs-0'>
                    <th>Proceso</th>
                    <th>Descripción</th>
                    <th>Frecuencia</th>
                    <th>Temporalidad</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Hitos Asociados</th>
                    <th className='text-end'>Acciones</th>
                  </tr>
                </thead>
                <tbody className='text-gray-600 fw-semibold'>
                  {filteredProcesos.map((proceso) => (
                    <tr key={proceso.id}>
                      <td>{proceso.nombre}</td>
                      <td>{proceso.descripcion || '-'}</td>
                      <td>{proceso.frecuencia}</td>
                      <td>
                        <span className='badge badge-light-primary'>
                          {proceso.temporalidad}
                        </span>
                      </td>
                      <td>{new Date(proceso.fecha_inicio).toLocaleDateString()}</td>
                      <td>{proceso.fecha_fin ? new Date(proceso.fecha_fin).toLocaleDateString() : '-'}</td>
                      <td>
                        <div className='d-flex flex-column gap-2' style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {groupedProcesoHitos[proceso.id]?.map((ph) => (
                            <div key={ph.id} className='d-flex align-items-center justify-content-between'>
                              <div className='d-flex align-items-center'>
                                <span className={`badge badge-light-${ph.hitoData.obligatorio ? 'success' : 'warning'} me-2`}>
                                  {ph.hitoData.obligatorio ? '●' : '○'}
                                </span>
                                <span>{ph.hitoData.nombre}</span>
                              </div>
                              <button
                                className='btn btn-sm btn-icon btn-light-danger'
                                onClick={() => handleDeleteHito(ph.id)}
                                title='Eliminar hito'
                              >
                                <KTSVG path='/media/icons/duotune/general/gen027.svg' className='svg-icon-1' />
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className='text-end'>
                        <div className='d-flex justify-content-end gap-2'>
                          <button
                            className='btn btn-sm btn-light-primary'
                            onClick={() => handleAddHitos(proceso)}
                          >
                            <KTSVG path='/media/icons/duotune/arrows/arr075.svg' className='svg-icon-2 me-2' />
                            Añadir Hitos
                          </button>
                          <div className='dropdown'>
                            <button
                              className='btn btn-sm btn-light btn-active-light-primary'
                              type='button'
                              data-bs-toggle='dropdown'
                              aria-expanded='false'
                            >
                              Acciones
                              <KTSVG
                                path='/media/icons/duotune/arrows/arr072.svg'
                                className='svg-icon-5 m-0'
                              />
                            </button>
                            <ul className='dropdown-menu menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-bold fs-7 w-125px py-4'>
                              <li className='menu-item px-3'>
                                <a
                                  href='#'
                                  className='menu-link px-3'
                                  onClick={() => handleEditar(proceso)}
                                >
                                  Editar
                                </a>
                              </li>
                              <li className='menu-item px-3'>
                                <a
                                  href='#'
                                  className='menu-link px-3 text-danger'
                                  onClick={() => handleEliminar(proceso.id)}
                                >
                                  Eliminar
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SharedPagination
              currentPage={page}
              totalItems={total}
              pageSize={limit}
              onPageChange={setPage}
            />
          </>
        )}
      </KTCardBody>

      <ProcesoModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSaveProceso}
        proceso={procesoEditando}
      />

      <ProcesoHitosMaestroModal
        show={showHitosModal}
        onHide={() => setShowHitosModal(false)}
        onSave={handleSaveHitos}
        procesos={procesos}
        hitos={hitos}
        hitoMaestro={null}
        hitosActuales={procesoHitos}
        selectedProcesoId={selectedProcesoForHitos?.id || 0}
      />
    </KTCard>
  )
}

export default ProcesosList
