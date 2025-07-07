import {FC, useState, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {KTCard, KTCardBody} from '../../../_metronic/helpers'
import PlantillaModal from './components/PlantillaModal'
import PlantillaProcesosModal from './components/PlantillaProcesosModal'
import {Plantilla, getAllPlantillas, createPlantilla, updatePlantilla, deletePlantilla} from '../../api/plantillas'
import {PlantillaProcesos, getAllPlantillaProcesos, createPlantillaProcesos, deletePlantillaProcesos} from '../../api/plantillaProcesos'
import {Proceso, getAllProcesos} from '../../api/procesos'
import SharedPagination from '../../components/pagination/SharedPagination'

const PlantillasList: FC = () => {
  const navigate = useNavigate()
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [plantillaEditando, setPlantillaEditando] = useState<Plantilla | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [procesos, setProcesos] = useState<Proceso[]>([])
  const [plantillaProcesos, setPlantillaProcesos] = useState<PlantillaProcesos[]>([])
  const [showProcesosModal, setShowProcesosModal] = useState(false)
  const [selectedPlantillaForProcesos, setSelectedPlantillaForProcesos] = useState<Plantilla | null>(null)
  const limit = 10

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
      const [plantillasData, procesosData, plantillaProcesosData] = await Promise.all([
        getAllPlantillas(page, limit, sortField, sortDirection),
        getAllProcesos(),
        getAllPlantillaProcesos()
      ])

      setPlantillas(plantillasData.plantillas)
      setTotal(plantillasData.total)
      setProcesos(procesosData.procesos || [])
      setPlantillaProcesos(plantillaProcesosData.plantillaProcesos || [])
      setError(null) // Limpiar errores previos
    } catch (error: any) {
      // Si es un error 404, mostrar tabla vacía (no hay plantillas)
      if (error?.response?.status === 404) {
        setPlantillas([])
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

  const handleSavePlantilla = async (plantillaData: Omit<Plantilla, 'id'>) => {
    try {
      if (plantillaEditando) {
        const updated = await updatePlantilla(plantillaEditando.id, plantillaData)
        setPlantillas(plantillas.map((p) => (p.id === plantillaEditando.id ? updated : p)))
      } else {
        const created = await createPlantilla(plantillaData)
        setPlantillas([...plantillas, created])
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar la plantilla:', error)
    }
  }

  const handleEliminar = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
      try {
        await deletePlantilla(id)
        setPlantillas(plantillas.filter((plantilla) => plantilla.id !== id))
      } catch (error: any) {
        // Extraer el mensaje de error del backend
        let errorMessage = 'Error al eliminar la plantilla'
        if (error?.response?.data?.detail) {
          errorMessage = error.response.data.detail
        } else if (error?.message) {
          errorMessage = error.message
        }
        alert(errorMessage)
      }
    }
  }

  const handleSaveProcesos = async (newRelations: Omit<PlantillaProcesos, 'id'>[]) => {
    try {
      const promises = newRelations.map(relation => createPlantillaProcesos(relation))
      await Promise.all(promises)
      loadAll()
      setShowProcesosModal(false)
    } catch (error) {
      console.error('Error al guardar procesos:', error)
    }
  }

  const filteredPlantillas = plantillas.filter((plantilla) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()

    return Object.values(plantilla).some(value =>
      value?.toString().toLowerCase().includes(searchLower)
    )
  })

  const groupedPlantillaProcesos = plantillaProcesos.reduce((groups, pp) => {
    if (!groups[pp.plantilla_id]) {
      groups[pp.plantilla_id] = []
    }
    const proceso = procesos.find(p => p.id === pp.proceso_id)
    if (proceso) {
      groups[pp.plantilla_id].push({ ...pp, procesoData: proceso })
    }
    return groups
  }, {} as Record<number, Array<PlantillaProcesos & { procesoData: Proceso }>>)

  return (
    <KTCard>
      <div className='card-header border-0 pt-6'>
        <div className='card-title'>
          <div className='d-flex align-items-center position-relative my-1'>
            <i className='bi bi-search position-absolute ms-6'></i>
            <input
              type='text'
              className='form-control form-control-solid w-250px ps-14'
              placeholder='Buscar plantilla'
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
              onClick={() => {
                setPlantillaEditando(null)
                setShowModal(true)
              }}
            >
              <i className="bi bi-plus-circle"></i>
              Añadir Plantilla
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
                      Plantilla {getSortIcon('nombre')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('descripcion')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      Descripción {getSortIcon('descripcion')}
                    </th>
                    <th>Procesos Asociados</th>
                    <th className='text-start'>Acciones</th>
                  </tr>
                </thead>
                <tbody className='text-gray-600 fw-semibold'>
                  {filteredPlantillas.map((plantilla) => (
                    <tr key={plantilla.id}>
                      <td>{plantilla.id}</td>
                      <td>
                        <div className='d-flex flex-column'>
                          <span className='fw-bold'>{plantilla.nombre}</span>
                        </div>
                      </td>
                      <td>{plantilla.descripcion || '-'}</td>
                      <td>
                        <div className='d-flex flex-column gap-2' style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {groupedPlantillaProcesos[plantilla.id]?.map((pp) => (
                            <div key={pp.id} className='d-flex align-items-center justify-content-between'>
                              <span>{pp.procesoData.nombre}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className='text-start'>
                        <div className='d-flex justify-content-start gap-2'>
                          <button
                            className='btn btn-sm btn-light-primary'
                            onClick={() => {
                              setSelectedPlantillaForProcesos(plantilla)
                              setShowProcesosModal(true)
                            }}
                          >
                            <i className='bi bi-plus-circle me-2'></i>
                            Añadir Procesos
                          </button>
                          <div className='dropdown' style={{ position: 'static' }}>
                            <button
                              className='btn btn-sm btn-light btn-active-light-primary'
                              type='button'
                              data-bs-toggle='dropdown'
                              aria-expanded='false'
                            >
                              Acciones
                              <i className="bi bi-chevron-down ms-1"></i>
                            </button>
                            <ul className='dropdown-menu dropdown-menu-end menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-bold fs-7 w-125px py-4'>
                              <li className='menu-item px-3'>
                                <a
                                  href='#'
                                  className='menu-link px-3'
                                  onClick={() => {
                                    setPlantillaEditando(plantilla)
                                    setShowModal(true)
                                  }}
                                >
                                  <i className="bi bi-pencil-square me-2"></i>
                                  Editar
                                </a>
                              </li>
                              <li className='menu-item px-3'>
                                <a
                                  href='#'
                                  className='menu-link px-3 text-danger'
                                  onClick={() => handleEliminar(plantilla.id)}
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

      <PlantillaModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSavePlantilla}
        plantilla={plantillaEditando}
      />

      <PlantillaProcesosModal
        show={showProcesosModal}
        onHide={() => setShowProcesosModal(false)}
        onSave={handleSaveProcesos}
        plantillas={plantillas}
        procesos={procesos}
        selectedPlantillaId={selectedPlantillaForProcesos?.id || 0}
        procesosActuales={plantillaProcesos}
      />
    </KTCard>
  )
}

export default PlantillasList
