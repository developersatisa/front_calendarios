import { FC, useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { KTCard, KTCardBody } from '../../../_metronic/helpers'
import CustomToast from '../../components/ui/CustomToast'
import PlantillaModal from './components/PlantillaModal'
import PlantillaProcesosModal from './components/PlantillaProcesosModal'
import { Plantilla, getAllPlantillas, createPlantilla, updatePlantilla, deletePlantilla } from '../../api/plantillas'
import { PlantillaProcesos, getAllPlantillaProcesos, createPlantillaProcesos, deletePlantillaProcesos } from '../../api/plantillaProcesos'
import { Proceso, getAllProcesos } from '../../api/procesos'
import SharedPagination from '../../components/pagination/SharedPagination'
import { atisaStyles, getPrimaryButtonStyles, getSecondaryButtonStyles, getTableHeaderStyles, getTableCellStyles, getBadgeStyles, getDropdownStyles, getActionsButtonStyles } from '../../styles/atisaStyles'

const PlantillasList: FC = () => {
  const navigate = useNavigate()
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [allPlantillas, setAllPlantillas] = useState<Plantilla[]>([]) // Todas las plantillas para búsqueda
  const [plantillaEditando, setPlantillaEditando] = useState<Plantilla | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [sortField, setSortField] = useState<string>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [procesos, setProcesos] = useState<Proceso[]>([])
  const [plantillaProcesos, setPlantillaProcesos] = useState<PlantillaProcesos[]>([])
  const [showProcesosModal, setShowProcesosModal] = useState(false)
  const [selectedPlantillaForProcesos, setSelectedPlantillaForProcesos] = useState<Plantilla | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; placement: 'top' | 'bottom' } | null>(null)
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({})
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info')
  const [showEliminarModal, setShowEliminarModal] = useState(false)
  const [plantillaAEliminar, setPlantillaAEliminar] = useState<Plantilla | null>(null)
  const limit = 10

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
      // No establecer searching en false aquí, se establecerá cuando termine loadAllPlantillas
    }, 300) // 300ms de delay

    return () => {
      clearTimeout(timer)
      if (!searchTerm) {
        setSearching(false)
      }
    }
  }, [searchTerm])

  // Cargar plantillas paginadas cuando NO hay búsqueda
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      loadAll()
    }
  }, [page, sortField, sortDirection, debouncedSearchTerm])

  // Cargar todas las plantillas cuando hay búsqueda
  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      setPage(1) // Resetear a la primera página cuando hay búsqueda
      loadAllPlantillas()
    } else {
      // Limpiar todas las plantillas cuando no hay búsqueda
      setAllPlantillas([])
    }
  }, [debouncedSearchTerm])

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
    const viewportHeight = window.innerHeight
    const dropdownHeight = 250 // Estimación razonable

    const showAbove = rect.bottom + dropdownHeight > viewportHeight

    return {
      top: showAbove ? rect.top + window.scrollY - 4 : rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      placement: showAbove ? 'top' as const : 'bottom' as const
    }
  }

  // Función para manejar el clic en el botón de acciones
  const handleActionsClick = (plantillaId: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (activeDropdown === plantillaId) {
      setActiveDropdown(null)
      setDropdownPosition(null)
    } else {
      const position = calculateDropdownPosition(event.currentTarget)
      setActiveDropdown(plantillaId)
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

  const loadAllPlantillas = async () => {
    try {
      setLoading(true)
      setSearching(true)
      // Cargar todas las plantillas sin paginación para búsqueda
      const plantillasData = await getAllPlantillas()
      setAllPlantillas(plantillasData.plantillas || [])
      // NO cargar datos adicionales durante la búsqueda para mejorar el rendimiento
      // Solo cargar si realmente no están disponibles
      if (procesos.length === 0 || plantillaProcesos.length === 0) {
        const [procesosData, plantillaProcesosData] = await Promise.all([
          getAllProcesos(),
          getAllPlantillaProcesos()
        ])
        setProcesos(procesosData.procesos || [])
        setPlantillaProcesos(plantillaProcesosData.plantillaProcesos || [])
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setAllPlantillas([])
      } else {
        setError('Error al cargar las plantillas')
        console.error('Error:', error)
      }
    } finally {
      setLoading(false)
      setSearching(false)
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
      if (debouncedSearchTerm.trim()) {
        await loadAllPlantillas()
      } else {
        await loadAll()
      }
    } catch (error) {
      console.error('Error al guardar la plantilla:', error)
    }
  }

  const handleEliminar = (id: number) => {
    const plantilla = plantillas.find(p => p.id === id) || filteredPlantillas.find(p => p.id === id)
    if (plantilla) {
      setPlantillaAEliminar(plantilla)
      setShowEliminarModal(true)
      setActiveDropdown(null)
      setDropdownPosition(null)
    }
  }

  const confirmarEliminar = async () => {
    if (!plantillaAEliminar) return

    try {
      await deletePlantilla(plantillaAEliminar.id)
      if (debouncedSearchTerm.trim()) {
        await loadAllPlantillas()
      } else {
        await loadAll()
      }
      showToastMessage('Plantilla eliminada correctamente', 'success')
    } catch (error: any) {
      // Extraer el mensaje de error del backend
      let errorMessage = 'Error al eliminar la plantilla'
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error?.message) {
        errorMessage = error.message
      }
      showToastMessage(errorMessage, 'error')
    } finally {
      setShowEliminarModal(false)
      setPlantillaAEliminar(null)
    }
  }

  const cancelarEliminar = () => {
    setShowEliminarModal(false)
    setPlantillaAEliminar(null)
  }

  const handleSaveProcesos = async (newRelations: Omit<PlantillaProcesos, 'id'>[]) => {
    try {
      const promises = newRelations.map(relation => createPlantillaProcesos(relation))
      await Promise.all(promises)
      if (debouncedSearchTerm.trim()) {
        await loadAllPlantillas()
      } else {
        await loadAll()
      }
      setShowProcesosModal(false)
    } catch (error) {
      console.error('Error al guardar procesos:', error)
    }
  }

  // Filtrar plantillas usando useMemo para optimizar el rendimiento
  // Función auxiliar para normalizar texto (sin tildes, sin mayúsculas)
  const normalizeText = (text: string | null | undefined): string => {
    if (!text) return ''
    return String(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  // Filtrar plantillas usando useMemo para optimizar el rendimiento
  const filteredPlantillas = useMemo(() => {
    // Si hay búsqueda, usar allPlantillas; si no, usar plantillas paginadas
    const plantillasToFilter = debouncedSearchTerm.trim() ? allPlantillas : plantillas

    if (!debouncedSearchTerm || !debouncedSearchTerm.trim()) return plantillasToFilter

    // Normalizar el término de búsqueda (asegurarse de que se convierta a string y luego normalizar)
    const searchTermStr = String(debouncedSearchTerm).trim()
    if (!searchTermStr) return plantillasToFilter

    const searchNormalized = normalizeText(searchTermStr)

    return plantillasToFilter.filter((plantilla) => {
      return Object.values(plantilla).some(value => {
        if (value === null || value === undefined) return false
        const valueNormalized = normalizeText(value.toString())
        return valueNormalized.includes(searchNormalized)
      })
    })
  }, [plantillas, allPlantillas, debouncedSearchTerm])

  // Aplicar paginación a los resultados filtrados
  const paginatedPlantillas = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return filteredPlantillas
    }
    // Cuando hay búsqueda, aplicar paginación a los resultados filtrados
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    return filteredPlantillas.slice(startIndex, endIndex)
  }, [filteredPlantillas, page, limit, debouncedSearchTerm])

  // Calcular el total para la paginación
  const totalForPagination = useMemo(() => {
    return debouncedSearchTerm.trim() ? filteredPlantillas.length : total
  }, [filteredPlantillas.length, total, debouncedSearchTerm])

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
            background: 'linear-gradient(135deg, #00505c 0%, #007b8a 100%)',
            color: 'white',
            borderRadius: '8px 8px 0 0',
            margin: 0,
            padding: '24px 16px'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', width: '100%' }}>
            {/* Izquierda: Botón Volver + Buscador */}
            <div className='d-flex align-items-center gap-3' style={{ justifyContent: 'flex-start' }}>
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
                Volver a Dashboard
              </button>
              <div className='d-flex align-items-center position-relative' style={{ position: 'relative' }}>
                <i
                  className='bi bi-search position-absolute ms-6'
                  style={{ color: atisaStyles.colors.light, zIndex: 1 }}
                ></i>
                <input
                  type='text'
                  className='form-control form-control-solid w-250px ps-14'
                  placeholder='Buscar plantilla...'
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

            {/* Centro: Título */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <h3 style={{
                fontFamily: atisaStyles.fonts.primary,
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                whiteSpace: 'nowrap',
                fontSize: '2rem'
              }}>
                Gestión de Plantillas
              </h3>
            </div>

            {/* Derecha: Botón Nuevo */}
            <div className='d-flex gap-2' style={{ justifyContent: 'flex-end' }}>
              <button
                type='button'
                className='btn'
                onClick={() => {
                  setPlantillaEditando(null)
                  setShowModal(true)
                }}
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
                Añadir Plantilla
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
              {filteredPlantillas.length === 0 ? (
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
                    className='bi bi-file-earmark-text'
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
                    No hay plantillas disponibles
                  </h4>
                  <p
                    style={{
                      fontFamily: atisaStyles.fonts.secondary,
                      color: atisaStyles.colors.dark,
                      margin: 0
                    }}
                  >
                    {debouncedSearchTerm ? 'No se encontraron plantillas que coincidan con tu búsqueda.' : 'Comienza creando tu primera plantilla.'}
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
                          Plantilla {getSortIcon('nombre')}
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
                          style={{
                            ...getTableHeaderStyles(),
                            fontFamily: atisaStyles.fonts.primary,
                            fontWeight: 'bold',
                            backgroundColor: atisaStyles.colors.light,
                            color: atisaStyles.colors.primary
                          }}
                        >
                          Procesos Asociados
                        </th>
                        <th
                          className='text-start'
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
                      {paginatedPlantillas.map((plantilla, index) => (
                        <tr
                          key={plantilla.id}
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
                            {plantilla.id}
                          </td>
                          <td style={{
                            ...getTableCellStyles(),
                            color: atisaStyles.colors.dark,
                            fontWeight: '600'
                          }}>
                            <div className='d-flex flex-column'>
                              <span className='fw-bold'>{plantilla.nombre}</span>
                            </div>
                          </td>
                          <td style={{
                            ...getTableCellStyles(),
                            color: atisaStyles.colors.dark,
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {plantilla.descripcion || '-'}
                          </td>
                          <td style={{
                            ...getTableCellStyles()
                          }}>
                            <div className='d-flex flex-column gap-2' style={{ maxHeight: '150px', overflowY: 'auto' }}>
                              {groupedPlantillaProcesos[plantilla.id]?.map((pp) => (
                                <div key={pp.id} className='d-flex align-items-center justify-content-between'>
                                  <span
                                    style={{
                                      fontFamily: atisaStyles.fonts.secondary,
                                      color: atisaStyles.colors.dark,
                                      fontSize: '12px'
                                    }}
                                  >
                                    {pp.procesoData.nombre}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td
                            className='text-start'
                            style={{
                              ...getTableCellStyles()
                            }}
                          >
                            <div className='d-flex justify-content-start gap-2'>
                              <button
                                className='btn btn-sm'
                                onClick={() => {
                                  setSelectedPlantillaForProcesos(plantilla)
                                  setShowProcesosModal(true)
                                }}
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
                                <i className='bi bi-plus-circle me-2'></i>
                                Añadir Procesos
                              </button>
                              <div className='dropdown-container' style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                  ref={(el) => (buttonRefs.current[plantilla.id] = el)}
                                  className='btn btn-sm'
                                  type='button'
                                  onClick={(e) => handleActionsClick(plantilla.id, e)}
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
                                  <i className={`bi ${activeDropdown === plantilla.id ? 'bi-chevron-up' : 'bi-chevron-down'} ms-1`}></i>
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

              {filteredPlantillas.length > 0 && (
                <SharedPagination
                  currentPage={page}
                  totalItems={totalForPagination}
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
              transform: dropdownPosition.placement === 'top' ? 'translateY(-100%)' : 'none',
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
                  const plantilla = filteredPlantillas.find(p => p.id === activeDropdown)
                  if (plantilla) {
                    setPlantillaEditando(plantilla)
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
                <i className="bi bi-pencil-square me-3" style={{ fontSize: '16px', color: 'inherit' }}></i>
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
                <i className="bi bi-trash3 me-3" style={{ fontSize: '16px', color: 'inherit' }}></i>
                Eliminar
              </button>
            </div>
          </div>,
          document.body
        )}

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

        {/* Custom Toast */}
        <CustomToast
          show={showToast}
          onClose={() => setShowToast(false)}
          message={toastMessage}
          type={toastType}
        />

        {/* Modal de confirmación para eliminar */}
        {showEliminarModal && plantillaAEliminar && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{
              background: 'rgba(0, 80, 92, 0.5)',
              zIndex: 10000,
              backdropFilter: 'blur(2px)'
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div
                className="modal-content"
                style={{
                  borderRadius: '16px',
                  border: `2px solid ${atisaStyles.colors.light}`,
                  boxShadow: '0 12px 40px rgba(0, 80, 92, 0.4)',
                  fontFamily: atisaStyles.fonts.secondary,
                  overflow: 'hidden'
                }}
              >
                <div
                  className="modal-header"
                  style={{
                    backgroundColor: atisaStyles.colors.error,
                    color: 'white',
                    borderRadius: '14px 14px 0 0',
                    border: 'none',
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <h5
                    className="modal-title"
                    style={{
                      fontFamily: atisaStyles.fonts.primary,
                      fontWeight: 'bold',
                      margin: 0,
                      fontSize: '1.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <i className="bi bi-trash3-fill" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                    Confirmar Eliminación
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={cancelarEliminar}
                    style={{
                      filter: 'invert(1)',
                      opacity: 0.8,
                      transition: 'opacity 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.8'
                    }}
                  ></button>
                </div>
                <div
                  className="modal-body"
                  style={{
                    padding: '28px 24px',
                    backgroundColor: 'white'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      marginBottom: '20px'
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#fee2e2',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <i className="bi bi-exclamation-octagon-fill" style={{ color: atisaStyles.colors.error, fontSize: '24px' }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4
                        style={{
                          color: atisaStyles.colors.primary,
                          marginBottom: '16px',
                          fontFamily: atisaStyles.fonts.primary,
                          fontWeight: 'bold',
                          fontSize: '1.2rem'
                        }}
                      >
                        ¿Está seguro de eliminar esta plantilla?
                      </h4>
                      <div
                        style={{
                          backgroundColor: '#f8f9fa',
                          padding: '12px',
                          borderRadius: '8px',
                          marginBottom: '16px',
                          border: `1px solid ${atisaStyles.colors.light}`
                        }}
                      >
                        <p style={{ color: atisaStyles.colors.dark, marginBottom: '0', fontFamily: atisaStyles.fonts.secondary }}>
                          <strong>Plantilla:</strong> {plantillaAEliminar.nombre}
                        </p>
                      </div>
                      <div
                        className="alert"
                        style={{
                          backgroundColor: '#fee2e2',
                          border: '1px solid #fecaca',
                          color: '#b91c1c',
                          borderRadius: '8px',
                          marginBottom: '0',
                          fontFamily: atisaStyles.fonts.secondary
                        }}
                      >
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>Esta acción eliminará la plantilla permanentemente y no se puede deshacer.</strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="modal-footer"
                  style={{
                    border: 'none',
                    padding: '20px 24px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '0 0 14px 14px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                  }}
                >
                  <button
                    type="button"
                    className="btn"
                    onClick={cancelarEliminar}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontFamily: atisaStyles.fonts.secondary,
                      fontWeight: '600',
                      padding: '10px 20px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(108, 117, 125, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#5a6268'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#6c757d'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(108, 117, 125, 0.2)'
                    }}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={confirmarEliminar}
                    style={{
                      backgroundColor: atisaStyles.colors.error,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontFamily: atisaStyles.fonts.secondary,
                      fontWeight: '600',
                      padding: '10px 20px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      boxShadow: `0 2px 8px ${atisaStyles.colors.error}4D`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.filter = 'brightness(0.9)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = `0 4px 12px ${atisaStyles.colors.error}66`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = 'none'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = `0 2px 8px ${atisaStyles.colors.error}4D`
                    }}
                  >
                    <i className="bi bi-trash3 me-2"></i>
                    Confirmar Eliminación
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </KTCard>
    </div>
  )
}

export default PlantillasList
