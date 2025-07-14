import { FC, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { KTCard, KTCardBody } from '../../../_metronic/helpers'
import HitoModal from './components/HitoModal'
import { Hito, getAllHitos, createHito, updateHito, deleteHito } from '../../api/hitos'
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
  const [sortField, setSortField] = useState<string>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadHitos()
  }, [page, sortField, sortDirection])

  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    } else {
      loadHitos()
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

  const loadHitos = async () => {
    try {
      setLoading(true)
      const data = await getAllHitos(page, limit, sortField, sortDirection)
      setHitos(data.hitos)
      setTotal(data.total)
      setError(null) // Limpiar errores previos
    } catch (error: any) {
      // Si es un error 404, mostrar tabla vacía (no hay hitos)
      if (error?.response?.status === 404) {
        setHitos([])
        setTotal(0)
        setError(null)
      } else {
        // Para otros errores, mostrar mensaje de error
        setError('Error al cargar los hitos')
        console.error('Error:', error)
      }
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
      } catch (error: any) {
        // Extraer el mensaje de error del backend
        let errorMessage = 'Error al eliminar el hito'
        if (error?.response?.data?.detail) {
          errorMessage = error.response.data.detail
        } else if (error?.message) {
          errorMessage = error.message
        }
        alert(errorMessage)
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
            <i className='bi bi-search position-absolute ms-6'></i>
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
              <i className="bi bi-arrow-left"></i>
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
              <i className="bi bi-plus-circle"></i>
              Nuevo Hito
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
                      Nombre {getSortIcon('nombre')}
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
                      onClick={() => handleSort('frecuencia')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      Frecuencia {getSortIcon('frecuencia')}
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
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('hora_limite')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      Hora Limite {getSortIcon('hora_limite')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('obligatorio')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      Obligatorio {getSortIcon('obligatorio')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('tipo')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      Tipo {getSortIcon('tipo')}
                    </th>
                    <th className='text-start'>Acciones</th>
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
                      <td>{new Date(hito.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                      <td>{hito.fecha_fin ? new Date(hito.fecha_fin).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</td>
                      <td>{hito.hora_limite ? hito.hora_limite.slice(0,5) : '-'}</td>
                      <td>
                        <span className={`badge badge-light-${hito.obligatorio ? 'success' : 'warning'}`}>
                          {hito.obligatorio ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td>{hito.tipo}</td>
                      <td className='text-start'>
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
                          <ul className='dropdown-menu dropdown-menu-start menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-bold fs-7 w-125px py-4'>
                            <li className='menu-item px-3'>
                              <a
                                href='#'
                                className='menu-link px-3'
                                onClick={() => {
                                  setHitoEditando(hito)
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
                                onClick={() => handleEliminar(hito.id)}
                              >
                                <i className="bi bi-trash3 me-2"></i>
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
