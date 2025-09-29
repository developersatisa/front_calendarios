import { FC, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { KTCard, KTCardBody } from '../../../_metronic/helpers'
import HitoModal from './components/HitoModal'
import { Hito, getAllHitos, createHito, updateHito, deleteHito } from '../../api/hitos'
import SharedPagination from '../../components/pagination/SharedPagination'
import { atisaStyles } from '../../styles/atisaStyles'

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
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({})

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

  // Función para calcular la posición del dropdown
  const calculateDropdownPosition = (buttonElement: HTMLButtonElement) => {
    const rect = buttonElement.getBoundingClientRect()
    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX
    }
  }

  // Función para manejar el clic en el botón de acciones
  const handleActionsClick = (hitoId: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (activeDropdown === hitoId) {
      setActiveDropdown(null)
      setDropdownPosition(null)
    } else {
      const position = calculateDropdownPosition(event.currentTarget)
      setActiveDropdown(hitoId)
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
            Gestión de Hitos
          </h3>
          <div className='d-flex align-items-center position-relative my-3'>
            <i
              className='bi bi-search position-absolute ms-6'
              style={{ color: atisaStyles.colors.light }}
            ></i>
            <input
              type='text'
              className='form-control form-control-solid w-250px ps-14'
              placeholder='Buscar hito...'
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
              style={{
                backgroundColor: 'transparent',
                border: `2px solid white`,
                color: 'white',
                fontFamily: atisaStyles.fonts.secondary,
                fontWeight: '600',
                borderRadius: '8px',
                padding: '8px 16px',
                transition: 'all 0.3s ease'
              }}
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
              onClick={() => {
                setHitoEditando(null)
                setShowModal(true)
              }}
              style={{
                backgroundColor: atisaStyles.colors.secondary,
                border: `2px solid ${atisaStyles.colors.secondary}`,
                color: 'white',
                fontFamily: atisaStyles.fonts.secondary,
                fontWeight: '600',
                borderRadius: '8px',
                padding: '8px 16px',
                transition: 'all 0.3s ease'
              }}
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
              Nuevo Hito
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
              borderRadius: '8px'
            }}
          >
            {error}
          </div>
        ) : (
          <>
            {filteredHitos.length === 0 ? (
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
                  className='bi bi-calendar-check'
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
                  No hay hitos disponibles
                </h4>
                <p
                  style={{
                    fontFamily: atisaStyles.fonts.secondary,
                    color: atisaStyles.colors.dark,
                    margin: 0
                  }}
                >
                  {searchTerm ? 'No se encontraron hitos que coincidan con tu búsqueda.' : 'Comienza creando tu primer hito.'}
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
                        transition: 'all 0.2s',
                        padding: '16px 8px',
                        borderBottom: `3px solid ${atisaStyles.colors.primary}`,
                        fontFamily: atisaStyles.fonts.primary,
                        fontWeight: 'bold',
                        borderLeft: 'none',
                        borderRight: 'none'
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
                        transition: 'all 0.2s',
                        padding: '16px 8px',
                        borderBottom: `3px solid ${atisaStyles.colors.primary}`,
                        fontFamily: atisaStyles.fonts.primary,
                        fontWeight: 'bold',
                        borderLeft: 'none',
                        borderRight: 'none'
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
                      Nombre {getSortIcon('nombre')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none'
                      onClick={() => handleSort('descripcion')}
                      style={{
                        transition: 'all 0.2s',
                        padding: '16px 8px',
                        borderBottom: `3px solid ${atisaStyles.colors.primary}`,
                        fontFamily: atisaStyles.fonts.primary,
                        fontWeight: 'bold',
                        borderLeft: 'none',
                        borderRight: 'none'
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
                      onClick={() => handleSort('fecha_inicio')}
                      style={{
                        transition: 'all 0.2s',
                        padding: '16px 8px',
                        borderBottom: `3px solid ${atisaStyles.colors.primary}`,
                        fontFamily: atisaStyles.fonts.primary,
                        fontWeight: 'bold',
                        borderLeft: 'none',
                        borderRight: 'none'
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
                      Fecha Inicio {getSortIcon('fecha_inicio')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none'
                      onClick={() => handleSort('fecha_fin')}
                      style={{
                        transition: 'all 0.2s',
                        padding: '16px 8px',
                        borderBottom: `3px solid ${atisaStyles.colors.primary}`,
                        fontFamily: atisaStyles.fonts.primary,
                        fontWeight: 'bold',
                        borderLeft: 'none',
                        borderRight: 'none'
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
                      Fecha Límite {getSortIcon('fecha_fin')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none'
                      onClick={() => handleSort('hora_limite')}
                      style={{
                        transition: 'all 0.2s',
                        padding: '16px 8px',
                        borderBottom: `3px solid ${atisaStyles.colors.primary}`,
                        fontFamily: atisaStyles.fonts.primary,
                        fontWeight: 'bold',
                        borderLeft: 'none',
                        borderRight: 'none'
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
                      Hora Límite {getSortIcon('hora_limite')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none'
                      onClick={() => handleSort('obligatorio')}
                      style={{
                        transition: 'all 0.2s',
                        padding: '16px 8px',
                        borderBottom: `3px solid ${atisaStyles.colors.primary}`,
                        fontFamily: atisaStyles.fonts.primary,
                        fontWeight: 'bold',
                        borderLeft: 'none',
                        borderRight: 'none'
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
                      Obligatorio {getSortIcon('obligatorio')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none'
                      onClick={() => handleSort('tipo')}
                      style={{
                        transition: 'all 0.2s',
                        padding: '16px 8px',
                        borderBottom: `3px solid ${atisaStyles.colors.primary}`,
                        fontFamily: atisaStyles.fonts.primary,
                        fontWeight: 'bold',
                        borderLeft: 'none',
                        borderRight: 'none'
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
                      Tipo {getSortIcon('tipo')}
                    </th>
                    <th
                      className='text-start'
                      style={{
                        padding: '16px 8px',
                        borderBottom: `3px solid ${atisaStyles.colors.primary}`,
                        fontFamily: atisaStyles.fonts.primary,
                        fontWeight: 'bold',
                        backgroundColor: atisaStyles.colors.light,
                        color: atisaStyles.colors.primary,
                        borderLeft: 'none',
                        borderRight: 'none'
                      }}
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHitos.map((hito, index) => (
                    <tr
                      key={hito.id}
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
                        padding: '12px 8px',
                        color: atisaStyles.colors.primary,
                        fontWeight: '600',
                        borderBottom: `1px solid ${atisaStyles.colors.light}`,
                        borderLeft: 'none',
                        borderRight: 'none'
                      }}>
                        {hito.id}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        color: atisaStyles.colors.dark,
                        fontWeight: '600',
                        borderBottom: `1px solid ${atisaStyles.colors.light}`,
                        borderLeft: 'none',
                        borderRight: 'none'
                      }}>
                        {hito.nombre}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        color: atisaStyles.colors.dark,
                        borderBottom: `1px solid ${atisaStyles.colors.light}`,
                        borderLeft: 'none',
                        borderRight: 'none',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {hito.descripcion || '-'}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        color: atisaStyles.colors.dark,
                        borderBottom: `1px solid ${atisaStyles.colors.light}`,
                        borderLeft: 'none',
                        borderRight: 'none'
                      }}>
                        {new Date(hito.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        color: atisaStyles.colors.dark,
                        borderBottom: `1px solid ${atisaStyles.colors.light}`,
                        borderLeft: 'none',
                        borderRight: 'none'
                      }}>
                        {hito.fecha_fin ? new Date(hito.fecha_fin).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        color: atisaStyles.colors.dark,
                        borderBottom: `1px solid ${atisaStyles.colors.light}`,
                        borderLeft: 'none',
                        borderRight: 'none'
                      }}>
                        {hito.hora_limite ? hito.hora_limite.slice(0,5) : '-'}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        borderBottom: `1px solid ${atisaStyles.colors.light}`,
                        borderLeft: 'none',
                        borderRight: 'none'
                      }}>
                        <span
                          className='badge'
                          style={{
                            backgroundColor: hito.obligatorio ? atisaStyles.colors.secondary : atisaStyles.colors.accent,
                            color: 'white',
                            fontFamily: atisaStyles.fonts.secondary,
                            fontWeight: '600',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px'
                          }}
                        >
                          {hito.obligatorio ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        color: atisaStyles.colors.dark,
                        borderBottom: `1px solid ${atisaStyles.colors.light}`,
                        borderLeft: 'none',
                        borderRight: 'none'
                      }}>
                        {hito.tipo}
                      </td>
                      <td className='text-start' style={{
                        padding: '12px 8px',
                        borderBottom: `1px solid ${atisaStyles.colors.light}`,
                        borderLeft: 'none',
                        borderRight: 'none',
                        position: 'relative'
                      }}>
                        <div className='dropdown-container' style={{
                          position: 'relative',
                          display: 'inline-block',
                          width: '100%'
                        }}>
                          <button
                            ref={(el) => (buttonRefs.current[hito.id] = el)}
                            className='btn'
                            type='button'
                            onClick={(e) => handleActionsClick(hito.id, e)}
                            style={{
                              backgroundColor: atisaStyles.colors.primary,
                              border: `2px solid ${atisaStyles.colors.primary}`,
                              color: 'white',
                              fontFamily: atisaStyles.fonts.secondary,
                              fontWeight: '600',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
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
                            <i className={`bi ${activeDropdown === hito.id ? 'bi-chevron-up' : 'bi-chevron-down'} ms-1`}></i>
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            )}

            {filteredHitos.length > 0 && (
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
                const hito = hitos.find(h => h.id === activeDropdown)
                if (hito) {
                  setHitoEditando(hito)
                  setShowModal(true)
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

      <HitoModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSaveHito}
        hito={hitoEditando}
      />
      </KTCard>
    </div>
  )
}

export default HitosList
