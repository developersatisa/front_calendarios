import {FC, useState, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {KTCard, KTCardBody, KTSVG} from '../../../_metronic/helpers'
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
  const [procesos, setProcesos] = useState<Proceso[]>([])
  const [plantillaProcesos, setPlantillaProcesos] = useState<PlantillaProcesos[]>([])
  const [showProcesosModal, setShowProcesosModal] = useState(false)
  const [selectedPlantillaForProcesos, setSelectedPlantillaForProcesos] = useState<Plantilla | null>(null)
  const limit = 10

  useEffect(() => {
    loadAll()
  }, [page])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [plantillasData, procesosData, plantillaProcesosData] = await Promise.all([
        getAllPlantillas(page, limit),
        getAllProcesos(),
        getAllPlantillaProcesos()
      ])

      setPlantillas(plantillasData.plantillas)
      setTotal(plantillasData.total)
      setProcesos(procesosData.procesos || [])
      setPlantillaProcesos(plantillaProcesosData.plantillaProcesos || [])
    } catch (error) {
      setError('Error al cargar los datos')
      console.error('Error:', error)
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
      } catch (error) {
        console.error('Error al eliminar:', error)
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

  const handleDeleteProceso = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este proceso de la plantilla?')) {
      try {
        await deletePlantillaProcesos(id)
        loadAll()
      } catch (error) {
        console.error('Error al eliminar:', error)
      }
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
            <KTSVG
              path='/media/icons/duotune/general/gen021.svg'
              className='svg-icon-1 position-absolute ms-6'
            />
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
              <KTSVG
                path='/media/icons/duotune/arrows/arr063.svg'
                className='svg-icon-2'
              />
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
              <KTSVG
                path='/media/icons/duotune/arrows/arr075.svg'
                className='svg-icon-2'
              />
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
                    <th>Plantilla</th>
                    <th>Procesos Asociados</th>
                    <th className='text-end'>Acciones</th>
                  </tr>
                </thead>
                <tbody className='text-gray-600 fw-semibold'>
                  {filteredPlantillas.map((plantilla) => (
                    <tr key={plantilla.id}>
                      <td>
                        <div className='d-flex flex-column'>
                          <span className='fw-bold'>{plantilla.nombre}</span>
                          <small className='text-muted'>{plantilla.descripcion || '-'}</small>
                        </div>
                      </td>
                      <td>
                        <div className='d-flex flex-column gap-2' style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {groupedPlantillaProcesos[plantilla.id]?.map((pp) => (
                            <div key={pp.id} className='d-flex align-items-center justify-content-between'>
                              <span>{pp.procesoData.nombre}</span>
                              <button
                                className='btn btn-sm btn-icon btn-light-danger'
                                onClick={() => handleDeleteProceso(pp.id)}
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
                            onClick={() => {
                              setSelectedPlantillaForProcesos(plantilla)
                              setShowProcesosModal(true)
                            }}
                          >
                            <KTSVG path='/media/icons/duotune/arrows/arr075.svg' className='svg-icon-2 me-2' />
                            Añadir Procesos
                          </button>
                          <div className='dropdown'>
                            <button
                              className='btn btn-sm btn-light btn-active-light-primary'
                              type='button'
                              data-bs-toggle='dropdown'
                              aria-expanded='false'
                            >
                              Acciones
                              <KTSVG path='/media/icons/duotune/arrows/arr072.svg' className='svg-icon-5 m-0' />
                            </button>
                            <ul className='dropdown-menu menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-bold fs-7 w-125px py-4'>
                              <li className='menu-item px-3'>
                                <a
                                  href='#'
                                  className='menu-link px-3'
                                  onClick={() => {
                                    setPlantillaEditando(plantilla)
                                    setShowModal(true)
                                  }}
                                >
                                  Editar
                                </a>
                              </li>
                              <li className='menu-item px-3'>
                                <a
                                  href='#'
                                  className='menu-link px-3 text-danger'
                                  onClick={() => handleEliminar(plantilla.id)}
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
