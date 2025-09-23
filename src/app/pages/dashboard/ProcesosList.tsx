import {FC, useState, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {KTCard, KTCardBody} from '../../../_metronic/helpers'
import ProcesoModal from './components/ProcesoModal'
import ProcesoHitosMaestroModal from './components/ProcesoHitosMaestroModal'
import {Proceso, getAllProcesos, createProceso, updateProceso, deleteProceso} from '../../api/procesos'
import {ProcesoHitos, getAllProcesoHitosMaestro, createProcesoHitosMaestro} from '../../api/procesoHitosMaestro'
import {Hito, getAllHitos} from '../../api/hitos'
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
  const [sortField, setSortField] = useState<string>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [hitos, setHitos] = useState<Hito[]>([])
  const [procesoHitos, setProcesoHitos] = useState<ProcesoHitos[]>([])
  const [showHitosModal, setShowHitosModal] = useState(false)
  const [selectedProcesoForHitos, setSelectedProcesoForHitos] = useState<Proceso | null>(null)

  useEffect(() => {
    loadAll()
  }, [page, sortField, sortDirection])

  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    } else {
      loadAll()
    }
  }, [searchTerm])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1) // Reset to first page when sorting changes
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return (
        <span className='ms-1 text-muted'>
          <i className='bi bi-arrow-down-up' style={{ fontSize: '12px' }}></i>
        </span>
      )
    }
    return (
      <span className='ms-1 text-primary'>
        <i className={`bi ${sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}`} style={{ fontSize: '12px' }}></i>
      </span>
    )
  }

  const loadAll = async () => {
    try {
      setLoading(true)
      const [procesosData, hitosData, procesoHitosData] = await Promise.all([
        getAllProcesos(page, limit, sortField, sortDirection),
        getAllHitos(),
        getAllProcesoHitosMaestro()
      ])
      setProcesos(procesosData.procesos)
      setTotal(procesosData.total)
      setHitos(hitosData.hitos || [])
      setProcesoHitos(procesoHitosData.ProcesoHitos || [])
      setError(null) // Limpiar errores previos
    } catch (error: any) {
      // Si es un error 404, mostrar tabla vacía (no hay procesos)
      if (error?.response?.status === 404) {
        setProcesos([])
        setTotal(0)
        setError(null)
      } else {
        // Para otros errores, mostrar mensaje de error
        setError('Error al cargar los datos')
        console.error('Error:', error)
      }
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
    if (confirm('¿Está seguro de eliminar este proceso?')) {
      try {
        await deleteProceso(id)
        loadAll()
      } catch (error: any) {
        // Extraer el mensaje de error del backend
        let errorMessage = 'Error al eliminar el proceso'
        if (error?.response?.data?.detail) {
          errorMessage = error.response.data.detail
        } else if (error?.message) {
          errorMessage = error.message
        }
        alert(errorMessage)
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
            <i className='bi bi-search position-absolute ms-6'></i>
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
              <i className="bi bi-arrow-left"></i>
              Volver
            </button>
            <button
              type='button'
              className='btn btn-primary'
              onClick={handleCrear}
            >
              <i className="bi bi-plus-circle"></i>
              Nuevo Proceso
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
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('id')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      ID {getSortIcon('id')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('nombre')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      Proceso {getSortIcon('nombre')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('descripcion')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      Descripción {getSortIcon('descripcion')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('temporalidad')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      Temporalidad {getSortIcon('temporalidad')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('fecha_inicio')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      Fecha Inicio {getSortIcon('fecha_inicio')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('fecha_fin')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      Fecha Fin {getSortIcon('fecha_fin')}
                    </th>
                    <th>Hitos Asociados</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody className='text-gray-600 fw-semibold'>
                  {filteredProcesos.map((proceso) => (
                    <tr key={proceso.id}>
                      <td>{proceso.id}</td>
                      <td>{proceso.nombre}</td>
                      <td>{proceso.descripcion || '-'}</td>
                      <td className='text-capitalize'>{proceso.temporalidad}</td>
                      <td>{new Date(proceso.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                      <td>{proceso.fecha_fin ? new Date(proceso.fecha_fin).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</td>
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
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className='d-flex gap-2'>
                          <button
                            className='btn btn-sm btn-light-primary'
                            onClick={() => handleAddHitos(proceso)}
                          >
                            Administrar Hitos
                          </button>
                          <div className='dropdown' style={{ position: 'static' }}>
                            <button
                              className='btn btn-sm btn-light btn-active-light-primary'
                              type='button'
                              data-bs-toggle='dropdown'
                              aria-expanded='false'
                            >
                              Acciones
                              <i className='bi bi-chevron-down ms-2'></i>
                            </button>
                            <ul className='dropdown-menu dropdown-menu-end menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-bold fs-7 w-125px py-4'>
                              <li className='menu-item px-3'>
                                <a
                                  href='#'
                                  className='menu-link px-3'
                                  onClick={() => handleEditar(proceso)}
                                >
                                  <i className="bi bi-pencil-square me-2"></i>
                                  Editar
                                </a>
                              </li>
                              <li className='menu-item px-3'>
                                <a
                                  href='#'
                                  className='menu-link px-3 text-danger'
                                  onClick={() => handleEliminar(proceso.id)}
                                >
                                  <i className="bi bi-trash3 me-2"></i>
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
