import {FC, useState, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {KTCard, KTCardBody, KTSVG} from '../../../_metronic/helpers'
import HitoModal from './components/HitoModal'
import {Hito, getAllHitos, createHito, updateHito, deleteHito} from '../../api/hitos'
import {getPageNumbers} from '../../utils/pagination'
import SharedPagination from '../../components/pagination/SharedPagination'

const HitosList: FC = () => {
  const navigate = useNavigate()
  const [hitos, setHitos] = useState<Hito[]>([])
  const [hitoEditando, setHitoEditando] = useState<Hito | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadHitos()
  }, [page])

  const loadHitos = async () => {
    try {
      setLoading(true)
      const data = await getAllHitos(page, limit)
      setHitos(data.hitos)
      setTotal(data.total)
    } catch (error) {
      setError('Error al cargar los hitos')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveHito = async (hitoData: Omit<Hito, 'id'>) => {
    try {
      if (hitoEditando) {
        const updated = await updateHito(hitoEditando.id, hitoData)
        setHitos(hitos.map((h) => (h.id === hitoEditando.id ? updated : h)))
      } else {
        const created = await createHito(hitoData)
        setHitos([...hitos, created])
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar el hito:', error)
    }
  }

  const handleEliminar = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este hito?')) {
      try {
        await deleteHito(id)
        setHitos(hitos.filter((hito) => hito.id !== id))
      } catch (error) {
        console.error('Error al eliminar el hito:', error)
      }
    }
  }

  const filteredHitos = hitos.filter((hito) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()

    return Object.values(hito).some(value =>
      value?.toString().toLowerCase().includes(searchLower)
    )
  })

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
              placeholder='Buscar hito'
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
                setHitoEditando(null)
                setShowModal(true)
              }}
            >
              <KTSVG
                path='/media/icons/duotune/arrows/arr075.svg'
                className='svg-icon-2'
              />
              Añadir Hito
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
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Frecuencia</th>
                    <th>Temporalidad</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Obligatorio</th>
                    <th className='text-end'>Acciones</th>
                  </tr>
                </thead>
                <tbody className='text-gray-600 fw-semibold'>
                  {filteredHitos.map((hito) => (
                    <tr key={hito.id}>
                      <td>{hito.id}</td>
                      <td>{hito.nombre}</td>
                      <td>{hito.descripcion || '-'}</td>
                      <td>{hito.frecuencia}</td>
                      <td className='text-capitalize'>{hito.temporalidad}</td>
                      <td>{new Date(hito.fecha_inicio).toLocaleDateString()}</td>
                      <td>{hito.fecha_fin ? new Date(hito.fecha_fin).toLocaleDateString() : '-'}</td>
                      <td>
                        <span className={`badge badge-light-${hito.obligatorio ? 'success' : 'warning'}`}>
                          {hito.obligatorio ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className='text-end'>
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
                                onClick={() => {
                                  setHitoEditando(hito)
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
                                onClick={() => handleEliminar(hito.id)}
                              >
                                Eliminar
                              </a>
                            </li>
                          </ul>
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
      <HitoModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSaveHito}
        hito={hitoEditando}
      />
    </KTCard>
  )
}

export default HitosList
