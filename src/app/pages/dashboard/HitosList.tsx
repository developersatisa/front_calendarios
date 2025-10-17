import { FC, useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { KTCard, KTCardBody } from '../../../_metronic/helpers'
import CustomToast from '../../components/ui/CustomToast'
import HitoModal from './components/HitoModal'
import { Hito, getAllHitos, createHito, updateHito, deleteHito } from '../../api/hitos'
import { deshabilitarHitosPorHitoDesde, deleteProcesoHitosByHito } from '../../api/clienteProcesoHitos'
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [sortField, setSortField] = useState<string>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({})
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info')
  const [showDeshabilitarModal, setShowDeshabilitarModal] = useState(false)
  const [hitoADeshabilitar, setHitoADeshabilitar] = useState<Hito | null>(null)
  const [fechaDesdeDeshabilitar, setFechaDesdeDeshabilitar] = useState('')
  const [showConfirmarDeshabilitar, setShowConfirmarDeshabilitar] = useState(false)

  // Función auxiliar para mostrar toasts
  const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  // Debounce para el término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      setSearching(true)
    }

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setSearching(false)
    }, 300) // 300ms de delay

    return () => {
      clearTimeout(timer)
      setSearching(false)
    }
  }, [searchTerm])

  useEffect(() => {
    loadHitos()
  }, [page, sortField, sortDirection])

  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    } else {
      loadHitos()
    }
  }, [debouncedSearchTerm])

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
        showToastMessage(errorMessage, 'error')
      }
    }
  }

  // Funciones para deshabilitar hito
  const abrirModalDeshabilitar = (hito: Hito) => {
    setHitoADeshabilitar(hito)
    // Establecer la fecha actual por defecto
    const fechaActual = new Date().toISOString().split('T')[0]
    setFechaDesdeDeshabilitar(fechaActual)
    setShowDeshabilitarModal(true)
    setActiveDropdown(null)
    setDropdownPosition(null)
  }

  // Función para deshabilitar hito directamente (sin modal)
  const deshabilitarHitoDirecto = async (hito: Hito) => {
    try {
      // Usar la fecha actual como fecha desde la cual deshabilitar
      const fechaActual = new Date().toISOString().split('T')[0]

      // 1. Deshabilitar hitos desde la fecha actual
      try {
        await deshabilitarHitosPorHitoDesde(hito.id, fechaActual)
      } catch (error: any) {
        // Si no hay relaciones, continuar con el proceso
        if (error?.response?.data?.detail?.includes('No se encontraron relaciones')) {
          // No hay relaciones para deshabilitar, continuar con el proceso
        } else {
          throw error
        }
      }

      // 2. Eliminar registros de proceso_hito
      try {
        await deleteProcesoHitosByHito(hito.id)
      } catch (error: any) {
        // Si no hay registros de proceso_hito, continuar con el proceso
        if (error?.response?.data?.detail?.includes('No se encontraron relaciones')) {
          // No hay registros de proceso_hito para eliminar, continuar con el proceso
        } else {
          throw error
        }
      }

      // 3. Actualizar el campo habilitado del hito a 0
      await updateHito(hito.id, {
        ...hito,
        habilitado: 0
      })

      showToastMessage(`Hito "${hito.nombre}" deshabilitado correctamente`, 'success')

      // Recargar la lista de hitos
      loadHitos()

    } catch (error: any) {
      console.error('Error al deshabilitar hito:', error)
      let errorMessage = 'Error al deshabilitar el hito'
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error?.message) {
        errorMessage = error.message
      }
      showToastMessage(errorMessage, 'error')
    }
  }

  const cerrarModalDeshabilitar = () => {
    setShowDeshabilitarModal(false)
    setHitoADeshabilitar(null)
    setFechaDesdeDeshabilitar('')
    setShowConfirmarDeshabilitar(false)
  }

  const abrirConfirmacionDeshabilitar = () => {
    if (!fechaDesdeDeshabilitar) {
      showToastMessage('Por favor seleccione una fecha desde la cual deshabilitar', 'warning')
      return
    }
    setShowConfirmarDeshabilitar(true)
  }

  const cancelarDeshabilitar = () => {
    setShowConfirmarDeshabilitar(false)
  }

  const confirmarDeshabilitar = async () => {
    if (!hitoADeshabilitar) return

    try {
      // 1. Deshabilitar hitos desde la fecha especificada
      try {
        await deshabilitarHitosPorHitoDesde(hitoADeshabilitar.id, fechaDesdeDeshabilitar)
      } catch (error: any) {
        // Si no hay relaciones, continuar con el proceso
        if (error?.response?.data?.detail?.includes('No se encontraron relaciones')) {
          // No hay relaciones para deshabilitar, continuar con el proceso
        } else {
          throw error
        }
      }

      // 2. Eliminar registros de proceso_hito
      try {
        await deleteProcesoHitosByHito(hitoADeshabilitar.id)
      } catch (error: any) {
        // Si no hay registros de proceso_hito, continuar con el proceso
        if (error?.response?.data?.detail?.includes('No se encontraron relaciones')) {
          // No hay registros de proceso_hito para eliminar, continuar con el proceso
        } else {
          throw error
        }
      }

      // 3. Actualizar el campo habilitado del hito a 0
      await updateHito(hitoADeshabilitar.id, {
        ...hitoADeshabilitar,
        habilitado: 0
      })

      showToastMessage(`Hito "${hitoADeshabilitar.nombre}" deshabilitado correctamente desde ${fechaDesdeDeshabilitar}`, 'success')
      cerrarModalDeshabilitar()

      // Recargar la lista de hitos
      loadHitos()

    } catch (error: any) {
      console.error('Error al deshabilitar hito:', error)
      let errorMessage = 'Error al deshabilitar el hito'
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error?.message) {
        errorMessage = error.message
      }
      showToastMessage(errorMessage, 'error')
    }
  }

  // Función para habilitar hito
  const habilitarHito = async (hito: Hito) => {
    try {
      // Solo actualizar el campo habilitado del hito a 1
      await updateHito(hito.id, {
        ...hito,
        habilitado: 1
      })

      showToastMessage(`Hito "${hito.nombre}" habilitado correctamente`, 'success')

      // Recargar la lista de hitos
      loadHitos()

    } catch (error: any) {
      console.error('Error al habilitar hito:', error)
      let errorMessage = 'Error al habilitar el hito'
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error?.message) {
        errorMessage = error.message
      }
      showToastMessage(errorMessage, 'error')
    }
  }

  // Filtrar hitos usando useMemo para optimizar el rendimiento
  const filteredHitos = useMemo(() => {
    if (!debouncedSearchTerm) return hitos

    const searchLower = debouncedSearchTerm.toLowerCase()
    return hitos.filter((hito) => {
      return Object.values(hito).some(value =>
        value?.toString().toLowerCase().includes(searchLower)
      )
    })
  }, [hitos, debouncedSearchTerm])

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
            <div className='d-flex align-items-center position-relative my-3' style={{ position: 'relative' }}>
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
                  fontSize: '14px',
                  paddingRight: searching ? '50px' : '16px'
                }}
              />
              {searching && (
                <div
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  }}
                >
                  <div
                    className="spinner-border spinner-border-sm"
                    role="status"
                    style={{
                      color: atisaStyles.colors.primary,
                      width: '20px',
                      height: '20px'
                    }}
                  >
                    <span className="visually-hidden">Buscando...</span>
                  </div>
                </div>
              )}
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
                    {debouncedSearchTerm ? 'No se encontraron hitos que coincidan con tu búsqueda.' : 'Comienza creando tu primer hito.'}
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
                          onClick={() => handleSort('fecha_limite')}
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
                          Fecha Límite {getSortIcon('fecha_limite')}
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
                          className='cursor-pointer user-select-none'
                          onClick={() => handleSort('habilitado')}
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
                          Habilitado {getSortIcon('habilitado')}
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
                            {hito.fecha_limite ? new Date(hito.fecha_limite).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                          </td>
                          <td style={{
                            padding: '12px 8px',
                            color: atisaStyles.colors.dark,
                            borderBottom: `1px solid ${atisaStyles.colors.light}`,
                            borderLeft: 'none',
                            borderRight: 'none'
                          }}>
                            {hito.hora_limite ? hito.hora_limite.slice(0, 5) : '-'}
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
                          <td style={{
                            padding: '12px 8px',
                            borderBottom: `1px solid ${atisaStyles.colors.light}`,
                            borderLeft: 'none',
                            borderRight: 'none'
                          }}>
                            <span
                              className='badge'
                              style={{
                                backgroundColor: hito.habilitado === 1 ? atisaStyles.colors.secondary : '#6c757d',
                                color: 'white',
                                fontFamily: atisaStyles.fonts.secondary,
                                fontWeight: '600',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px'
                              }}
                            >
                              {hito.habilitado === 1 ? 'Sí' : 'No'}
                            </span>
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
                   const hito = hitos.find(h => h.id === activeDropdown)
                   if (hito) {
                     if (hito.habilitado === 1) {
                       abrirModalDeshabilitar(hito)
                     } else {
                       habilitarHito(hito)
                     }
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
                   color: hitos.find(h => h.id === activeDropdown)?.habilitado === 1 ? '#f59e0b' : '#28a745',
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
                   const hito = hitos.find(h => h.id === activeDropdown)
                   if (hito?.habilitado === 1) {
                     e.currentTarget.style.backgroundColor = '#fef3cd'
                     e.currentTarget.style.color = '#856404'
                   } else {
                     e.currentTarget.style.backgroundColor = '#d4edda'
                     e.currentTarget.style.color = '#155724'
                   }
                 }}
                 onMouseLeave={(e) => {
                   const hito = hitos.find(h => h.id === activeDropdown)
                   e.currentTarget.style.backgroundColor = 'transparent'
                   e.currentTarget.style.color = hito?.habilitado === 1 ? '#f59e0b' : '#28a745'
                 }}
               >
                 <i
                   className={`bi ${hitos.find(h => h.id === activeDropdown)?.habilitado === 1 ? 'bi-slash-circle' : 'bi-check-circle'} me-3`}
                   style={{ fontSize: '16px', color: 'white' }}
                 ></i>
                 {hitos.find(h => h.id === activeDropdown)?.habilitado === 1 ? 'Deshabilitar' : 'Habilitar'}
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

        {/* Modal para deshabilitar hito */}
        {showDeshabilitarModal && hitoADeshabilitar && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header" style={{ backgroundColor: atisaStyles.colors.primary, color: 'white' }}>
                  <h5 className="modal-title" style={{ color: 'white' }}>
                    <i className="bi bi-slash-circle me-2"></i>
                    Deshabilitar Hito
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={cerrarModalDeshabilitar}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: '600', color: atisaStyles.colors.primary }}>
                      <i className="bi bi-calendar me-2"></i>
                      Hito a deshabilitar
                    </label>
                    <div
                      className="form-control"
                      style={{
                        backgroundColor: '#f8f9fa',
                        border: `2px solid ${atisaStyles.colors.light}`,
                        borderRadius: '6px',
                        fontFamily: atisaStyles.fonts.secondary,
                        fontWeight: '600',
                        color: atisaStyles.colors.primary
                      }}
                    >
                      {hitoADeshabilitar.nombre}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: '600', color: atisaStyles.colors.primary }}>
                      <i className="bi bi-calendar-date me-2"></i>
                      Fecha desde la cual deshabilitar
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaDesdeDeshabilitar}
                      onChange={(e) => setFechaDesdeDeshabilitar(e.target.value)}
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        border: `2px solid ${atisaStyles.colors.light}`,
                        borderRadius: '6px'
                      }}
                    />
                  </div>

                  <div className="alert alert-warning" style={{ marginBottom: '0' }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Advertencia:</strong> Esta acción deshabilitará el hito desde la fecha seleccionado en los calendarios de
                    los clientes y eliminara el hito en los procesos que este asociado.
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cerrarModalDeshabilitar}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ backgroundColor: '#f59e0b', color: 'white' }}
                    onClick={abrirConfirmacionDeshabilitar}
                    disabled={!fechaDesdeDeshabilitar}
                  >
                    <i className="bi bi-slash-circle me-2"></i>
                    Continuar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para deshabilitar */}
        {showConfirmarDeshabilitar && hitoADeshabilitar && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header" style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                  <h5 className="modal-title" style={{ color: 'white' }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Confirmar Deshabilitación
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={cancelarDeshabilitar}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="text-center">
                    <i
                      className="bi bi-exclamation-triangle-fill"
                      style={{
                        fontSize: '48px',
                        color: '#f59e0b',
                        marginBottom: '16px'
                      }}
                    ></i>
                    <h4 style={{ color: atisaStyles.colors.primary, marginBottom: '16px' }}>
                      ¿Está seguro de deshabilitar este hito?
                    </h4>
                    <p style={{ color: atisaStyles.colors.dark, marginBottom: '8px' }}>
                      <strong>Hito:</strong> {hitoADeshabilitar.nombre}
                    </p>
                    <p style={{ color: atisaStyles.colors.dark, marginBottom: '16px' }}>
                      <strong>Fecha desde:</strong> {fechaDesdeDeshabilitar}
                    </p>
                    <div className="alert alert-danger" style={{ marginBottom: '0' }}>
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Esta acción No se puede deshacer</strong>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cancelarDeshabilitar}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmarDeshabilitar}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Confirmar Deshabilitación
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Toast */}
        <CustomToast
          show={showToast}
          onClose={() => setShowToast(false)}
          message={toastMessage}
          type={toastType}
          delay={5000}
        />
      </KTCard>
    </div>
  )
}

export default HitosList
