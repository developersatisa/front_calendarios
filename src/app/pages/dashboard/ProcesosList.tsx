import {FC, useState, useEffect, useRef} from 'react'
import {createPortal} from 'react-dom'
import {useNavigate} from 'react-router-dom'
import {KTCard, KTCardBody} from '../../../_metronic/helpers'
import ProcesoModal from './components/ProcesoModal'
import ProcesoHitosMaestroModal from './components/ProcesoHitosMaestroModal'
import {Proceso, getAllProcesos, createProceso, updateProceso, deleteProceso} from '../../api/procesos'
import {ProcesoHitos, getAllProcesoHitosMaestro, createProcesoHitosMaestro} from '../../api/procesoHitosMaestro'
import {Hito, getAllHitos} from '../../api/hitos'
import SharedPagination from '../../components/pagination/SharedPagination'
import {atisaStyles, getPrimaryButtonStyles, getSecondaryButtonStyles, getTableHeaderStyles, getTableCellStyles, getBadgeStyles, getDropdownStyles, getActionsButtonStyles} from '../../styles/atisaStyles'

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
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({})

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
        <span className='ms-1'>
          <i
            className='bi bi-arrow-down-up'
            style={{
              fontSize: '12px',
              color: atisaStyles.colors.primary,
              opacity: 0.6
            }}
          ></i>
        </span>
      )
    }
    return (
      <span className='ms-1'>
        <i
          className={`bi ${sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}`}
          style={{
            fontSize: '12px',
            color: 'white',
            fontWeight: 'bold'
          }}
        ></i>
      </span>
    )
  }

  // Función para calcular la posición del dropdown
  const calculateDropdownPosition = (buttonElement: HTMLButtonElement) => {
    const rect = buttonElement.getBoundingClientRect()
    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX
    }
  }

  // Función para manejar el clic en el botón de acciones
  const handleActionsClick = (procesoId: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (activeDropdown === procesoId) {
      setActiveDropdown(null)
      setDropdownPosition(null)
    } else {
      const position = calculateDropdownPosition(event.currentTarget)
      setActiveDropdown(procesoId)
      setDropdownPosition(position)
    }
  }

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown !== null) {
        const target = event.target as HTMLElement
        if (!target.closest('.dropdown-container') && !target.closest('.dropdown-portal')) {
          setActiveDropdown(null)
          setDropdownPosition(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeDropdown])

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
    if (!groups[ph.proceso_id]) {
      groups[ph.proceso_id] = []
    }
    const hito = hitos.find(h => h.id === ph.hito_id)
    if (hito) {
      groups[ph.proceso_id].push({...ph, hitoData: hito})
    }
    return groups
  }, {} as Record<number, Array<ProcesoHitos & {hitoData: Hito}>>)

  const handleAddHitos = (proceso: Proceso) => {
    // Filtrar los hitos actuales del proceso seleccionado
    const hitosActualesProceso = procesoHitos.filter(ph => ph.proceso_id === proceso.id)
    setSelectedProcesoForHitos(proceso)
    setShowHitosModal(true)
  }

  return (
    <div style={{
      fontFamily: atisaStyles.fonts.secondary,
      boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
      border: `1px solid ${atisaStyles.colors.light}`,
      borderRadius: '12px',
      overflow: 'hidden',
      margin: 0,
      width: '100%'
    }}>
      <KTCard>
        <div
          className='card-header border-0 pt-6'
          style={{
            backgroundColor: atisaStyles.colors.primary,
            color: 'white',
            borderRadius: '8px 8px 0 0',
            margin: 0,
            padding: '24px 16px'
          }}
        >
          <div className='card-title'>
            <h3 style={{
              fontFamily: atisaStyles.fonts.primary,
              fontWeight: 'bold',
              color: 'white',
              margin: 0
            }}>
              Gestión de Procesos
            </h3>
            <div className='d-flex align-items-center position-relative my-3'>
              <i
                className='bi bi-search position-absolute ms-6'
                style={{ color: atisaStyles.colors.light }}
              ></i>
              <input
                type='text'
                className='form-control form-control-solid w-250px ps-14'
                placeholder='Buscar proceso...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  backgroundColor: 'white',
                  border: `2px solid ${atisaStyles.colors.light}`,
                  borderRadius: '8px',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          <div className='card-toolbar'>
            <div className='d-flex justify-content-end gap-2'>
              <button
                type='button'
                className='btn'
                onClick={() => navigate('/dashboard')}
                style={getSecondaryButtonStyles()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.color = atisaStyles.colors.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'white'
                }}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Volver
              </button>
              <button
                type='button'
                className='btn'
                onClick={handleCrear}
                style={getPrimaryButtonStyles()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                  e.currentTarget.style.borderColor = atisaStyles.colors.accent
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                  e.currentTarget.style.borderColor = atisaStyles.colors.secondary
                }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Nuevo Proceso
              </button>
            </div>
          </div>
        </div>
        <KTCardBody className='p-0'>
          {loading ? (
            <div className='d-flex justify-content-center py-5'>
              <div
                className='spinner-border'
                role='status'
                style={{
                  color: atisaStyles.colors.primary,
                  width: '3rem',
                  height: '3rem'
                }}
              >
                <span className='visually-hidden'>Cargando...</span>
              </div>
            </div>
          ) : error ? (
            <div
              className='alert alert-danger'
              style={{
                backgroundColor: '#f8d7da',
                border: `1px solid #f5c6cb`,
                color: '#721c24',
                fontFamily: atisaStyles.fonts.secondary,
                borderRadius: '8px',
                margin: '16px'
              }}
            >
              {error}
            </div>
          ) : (
            <>
              {filteredProcesos.length === 0 ? (
                <div
                  className='text-center py-5'
                  style={{
                    backgroundColor: atisaStyles.colors.light,
                    borderRadius: '0',
                    border: `2px dashed ${atisaStyles.colors.primary}`,
                    padding: '40px 20px',
                    margin: 0,
                    width: '100%'
                  }}
                >
                  <i
                    className='bi bi-diagram-3'
                    style={{
                      fontSize: '48px',
                      color: atisaStyles.colors.primary,
                      marginBottom: '16px'
                    }}
                  ></i>
                  <h4
                    style={{
                      fontFamily: atisaStyles.fonts.primary,
                      color: atisaStyles.colors.primary,
                      marginBottom: '8px'
                    }}
                  >
                    No hay procesos disponibles
                  </h4>
                  <p
                    style={{
                      fontFamily: atisaStyles.fonts.secondary,
                      color: atisaStyles.colors.dark,
                      margin: 0
                    }}
                  >
                    {searchTerm ? 'No se encontraron procesos que coincidan con tu búsqueda.' : 'Comienza creando tu primer proceso.'}
                  </p>
                </div>
              ) : (
                <div className='table-responsive' style={{ margin: 0 }}>
                  <table
                    className='table align-middle table-row-dashed fs-6 gy-0'
                    style={{
                      fontFamily: atisaStyles.fonts.secondary,
                      borderCollapse: 'separate',
                      borderSpacing: '0',
                      margin: 0,
                      width: '100%'
                    }}
                  >
                    <thead>
                      <tr
                        className='text-start fw-bold fs-7 text-uppercase gs-0'
                        style={{
                          backgroundColor: atisaStyles.colors.light,
                          color: atisaStyles.colors.primary
                        }}
                      >
                        <th
                          className='cursor-pointer user-select-none'
                          onClick={() => handleSort('id')}
                          style={{
                            ...getTableHeaderStyles(),
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                            e.currentTarget.style.color = atisaStyles.colors.primary
                          }}
                        >
                          ID {getSortIcon('id')}
                        </th>
                        <th
                          className='cursor-pointer user-select-none'
                          onClick={() => handleSort('nombre')}
                          style={{
                            ...getTableHeaderStyles(),
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                            e.currentTarget.style.color = atisaStyles.colors.primary
                          }}
                        >
                          Proceso {getSortIcon('nombre')}
                        </th>
                        <th
                          className='cursor-pointer user-select-none'
                          onClick={() => handleSort('descripcion')}
                          style={{
                            ...getTableHeaderStyles(),
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                            e.currentTarget.style.color = atisaStyles.colors.primary
                          }}
                        >
                          Descripción {getSortIcon('descripcion')}
                        </th>
                        <th
                          className='cursor-pointer user-select-none'
                          onClick={() => handleSort('temporalidad')}
                          style={{
                            ...getTableHeaderStyles(),
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                            e.currentTarget.style.color = atisaStyles.colors.primary
                          }}
                        >
                          Temporalidad {getSortIcon('temporalidad')}
                        </th>
                        <th
                          style={{
                            ...getTableHeaderStyles(),
                            fontFamily: atisaStyles.fonts.primary,
                            fontWeight: 'bold',
                            backgroundColor: atisaStyles.colors.light,
                            color: atisaStyles.colors.primary
                          }}
                        >
                          Hitos Asociados
                        </th>
                        <th
                          style={{
                            ...getTableHeaderStyles(),
                            fontFamily: atisaStyles.fonts.primary,
                            fontWeight: 'bold',
                            backgroundColor: atisaStyles.colors.light,
                            color: atisaStyles.colors.primary
                          }}
                        >
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProcesos.map((proceso, index) => (
                        <tr
                          key={proceso.id}
                          style={{
                            backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                            fontFamily: atisaStyles.fonts.secondary,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                            e.currentTarget.style.transform = 'translateY(-1px)'
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 80, 92, 0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa'
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          <td style={{
                            ...getTableCellStyles(),
                            color: atisaStyles.colors.primary,
                            fontWeight: '600'
                          }}>
                            {proceso.id}
                          </td>
                          <td style={{
                            ...getTableCellStyles(),
                            color: atisaStyles.colors.dark,
                            fontWeight: '600'
                          }}>
                            {proceso.nombre}
                          </td>
                          <td style={{
                            ...getTableCellStyles(),
                            color: atisaStyles.colors.dark,
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {proceso.descripcion || '-'}
                          </td>
                          <td style={{
                            ...getTableCellStyles(),
                            color: atisaStyles.colors.dark,
                            textTransform: 'capitalize'
                          }}>
                            {proceso.temporalidad}
                          </td>
                          <td style={{
                            ...getTableCellStyles()
                          }}>
                            <div className='d-flex flex-column gap-2' style={{ maxHeight: '150px', overflowY: 'auto' }}>
                              {groupedProcesoHitos[proceso.id]?.map((ph) => (
                                <div key={ph.id} className='d-flex align-items-center justify-content-between'>
                                  <div className='d-flex align-items-center'>
                                    <span
                                      className='badge me-2'
                                      style={getBadgeStyles(!!ph.hitoData.obligatorio)}
                                    >
                                      {ph.hitoData.obligatorio ? '●' : '○'}
                                    </span>
                                    <span style={{ fontSize: '12px' }}>{ph.hitoData.nombre}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{
                            ...getTableCellStyles()
                          }}>
                            <div className='d-flex gap-2'>
                              <button
                                className='btn btn-sm'
                                onClick={() => handleAddHitos(proceso)}
                                style={{
                                  backgroundColor: atisaStyles.colors.accent,
                                  border: `2px solid ${atisaStyles.colors.accent}`,
                                  color: 'white',
                                  fontFamily: atisaStyles.fonts.secondary,
                                  fontWeight: '600',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                  e.currentTarget.style.borderColor = atisaStyles.colors.primary
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                                  e.currentTarget.style.borderColor = atisaStyles.colors.accent
                                }}
                              >
                                Administrar Hitos
                              </button>
                              <div className='dropdown-container' style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                  ref={(el) => (buttonRefs.current[proceso.id] = el)}
                                  className='btn btn-sm'
                                  type='button'
                                  onClick={(e) => handleActionsClick(proceso.id, e)}
                                  style={getActionsButtonStyles()}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                                    e.currentTarget.style.borderColor = atisaStyles.colors.accent
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                    e.currentTarget.style.borderColor = atisaStyles.colors.primary
                                  }}
                                >
                                  Acciones
                                  <i className={`bi ${activeDropdown === proceso.id ? 'bi-chevron-up' : 'bi-chevron-down'} ms-1`}></i>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredProcesos.length > 0 && (
                <SharedPagination
                  currentPage={page}
                  totalItems={total}
                  pageSize={limit}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </KTCardBody>

        {/* Dropdown con portal */}
        {activeDropdown !== null && dropdownPosition && createPortal(
          <div
            className="dropdown-portal"
            style={{
              position: 'absolute',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              backgroundColor: 'white',
              border: `2px solid ${atisaStyles.colors.light}`,
              borderRadius: '8px',
              boxShadow: '0 8px 25px rgba(0, 80, 92, 0.3)',
              zIndex: 99999,
              minWidth: '160px',
              maxWidth: '200px'
            }}
          >
            <div
              style={{
                padding: '8px 0',
                fontFamily: atisaStyles.fonts.secondary
              }}
            >
              <button
                onClick={() => {
                  const proceso = procesos.find(p => p.id === activeDropdown)
                  if (proceso) {
                    handleEditar(proceso)
                  }
                  setActiveDropdown(null)
                  setDropdownPosition(null)
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: atisaStyles.colors.primary,
                  fontFamily: atisaStyles.fonts.secondary,
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                  e.currentTarget.style.color = atisaStyles.colors.accent
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = atisaStyles.colors.primary
                }}
              >
                <i className="bi bi-pencil-square me-3" style={{ fontSize: '16px', color: 'white' }}></i>
                Editar
              </button>

              <div style={{
                height: '1px',
                backgroundColor: atisaStyles.colors.light,
                margin: '4px 0'
              }}></div>

              <button
                onClick={() => {
                  handleEliminar(activeDropdown)
                  setActiveDropdown(null)
                  setDropdownPosition(null)
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#dc3545',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8d7da'
                  e.currentTarget.style.color = '#721c24'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#dc3545'
                }}
              >
                <i className="bi bi-trash3 me-3" style={{ fontSize: '16px', color: 'white' }}></i>
                Eliminar
              </button>
            </div>
          </div>,
          document.body
        )}

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
    </div>
  )
}

export default ProcesosList
