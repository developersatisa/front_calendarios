import React, { FC, useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { KTCard, KTCardBody, KTSVG } from '../../../_metronic/helpers'
import { Metadato, getAllMetadatos, createMetadato, updateMetadato, deleteMetadato } from '../../api/metadatos'
import { MetadatoArea, getAllMetadatosArea, createMetadatoArea } from '../../api/metadatosArea'
import { Subdepartamento, getAllSubdepartamentos } from '../../api/subdepartamentos'
import SharedPagination from '../../components/pagination/SharedPagination'
import MetadatoModal from './components/MetadatoModal'
import MetadatoSubdepartamentosModal from './components/MetadatoSubdepartamentosModal'
import {atisaStyles, getPrimaryButtonStyles, getSecondaryButtonStyles, getTableHeaderStyles, getTableCellStyles, getBadgeStyles, getDropdownStyles, getActionsButtonStyles} from '../../styles/atisaStyles'

const MetadatosList: FC = () => {
  const navigate = useNavigate()
  const [metadatos, setMetadatos] = useState<Metadato[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para paginación y ordenamiento
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('')

  // Estados para el modal
  const [showModal, setShowModal] = useState(false)
  const [editingMetadato, setEditingMetadato] = useState<Metadato | null>(null)

  // Estados para subdepartamentos y asociaciones
  const [subdepartamentos, setSubdepartamentos] = useState<Subdepartamento[]>([])
  const [metadatosArea, setMetadatosArea] = useState<MetadatoArea[]>([])
  const [showSubdepartamentosModal, setShowSubdepartamentosModal] = useState(false)
  const [selectedMetadatoForAreas, setSelectedMetadatoForAreas] = useState<Metadato | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({})

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
  const handleActionsClick = (metadatoId: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (activeDropdown === metadatoId) {
      setActiveDropdown(null)
      setDropdownPosition(null)
    } else {
      const position = calculateDropdownPosition(event.currentTarget)
      setActiveDropdown(metadatoId)
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
      const [metadatosData, subdepartamentosData, metadatosAreaData] = await Promise.all([
        getAllMetadatos(page, limit, sortField, sortDirection),
        getAllSubdepartamentos(),
        getAllMetadatosArea()
      ])
      setMetadatos(metadatosData.metadatos || [])
      setTotal(metadatosData.total || 0)
      setSubdepartamentos(subdepartamentosData.subdepartamentos || [])
      setMetadatosArea(metadatosAreaData || [])
      setError(null)
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setMetadatos([])
        setTotal(0)
        setError(null)
      } else {
        setError('Error al cargar los datos')
        console.error('Error:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [page, limit, sortField, sortDirection])

  // Filtrar metadatos por término de búsqueda
  const filteredMetadatos = metadatos.filter(metadato =>
    metadato.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (metadato.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    metadato.tipo_generacion.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Agrupar metadatos-area por metadato
  const groupedMetadatosArea = metadatosArea.reduce((groups, ma) => {
    if (!groups[ma.id_metadato]) {
      groups[ma.id_metadato] = []
    }
    const subdep = subdepartamentos.find(s => s.ceco === ma.codigo_ceco && s.ceco !== null)
    if (subdep) {
      groups[ma.id_metadato].push({ ...ma, subdepData: subdep })
    }
    return groups
  }, {} as Record<number, Array<MetadatoArea & { subdepData: Subdepartamento }>>)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleCreate = () => {
    setEditingMetadato(null)
    setShowModal(true)
  }

  const handleEdit = (metadato: Metadato) => {
    setEditingMetadato(metadato)
    setShowModal(true)
  }

  const handleSave = async (metadatoData: Omit<Metadato, 'id'>) => {
    try {
      // Transformar global_ a global para el backend
      const dataForBackend = {
        ...metadatoData,
        global: metadatoData.global_
      }
      // Eliminar global_ del objeto que se envía
      delete (dataForBackend as any).global_

      if (editingMetadato) {
        await updateMetadato(editingMetadato.id, dataForBackend)
      } else {
        await createMetadato(dataForBackend)
      }
      setShowModal(false)
      setEditingMetadato(null)
      await loadAll()
    } catch (error) {
      console.error('Error al guardar metadato:', error)
      setError('Error al guardar el metadato')
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este metadato?')) {
      try {
        await deleteMetadato(id)
        await loadAll()
      } catch (error) {
        console.error('Error al eliminar metadato:', error)
        setError('Error al eliminar el metadato')
      }
    }
  }

  const handleAsignarDepartamentos = (metadato: Metadato) => {
    setSelectedMetadatoForAreas(metadato)
    setShowSubdepartamentosModal(true)
  }

  const handleSaveSubdepartamentos = async (newRelations: { id_metadato: number; codigo_ceco: string }[]) => {
    try {
      const promises = newRelations.map(relation => createMetadatoArea(relation))
      await Promise.all(promises)
      await loadAll()
      setShowSubdepartamentosModal(false)
    } catch (error) {
      console.error('Error al guardar subdepartamentos:', error)
      setError('Error al guardar los subdepartamentos')
    }
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
              Gestión de Metadatos
            </h3>
            <div className='d-flex align-items-center position-relative my-3'>
              <i
                className='bi bi-search position-absolute ms-6'
                style={{ color: atisaStyles.colors.light }}
              ></i>
              <input
                type='text'
                className='form-control form-control-solid w-250px ps-14'
                placeholder='Buscar metadatos...'
                value={searchTerm}
                onChange={handleSearch}
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
                onClick={handleCreate}
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
                <i className='bi bi-plus-circle me-2'></i>
                Nuevo Metadato
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
              {filteredMetadatos.length === 0 ? (
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
                    className='bi bi-tags'
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
                    No hay metadatos disponibles
                  </h4>
                  <p
                    style={{
                      fontFamily: atisaStyles.fonts.secondary,
                      color: atisaStyles.colors.dark,
                      margin: 0
                    }}
                  >
                    {searchTerm ? 'No se encontraron metadatos que coincidan con tu búsqueda.' : 'Comienza creando tu primer metadato.'}
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
                          Nombre {getSortIcon('nombre')}
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
                          onClick={() => handleSort('tipo_generacion')}
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
                          Tipo Generación {getSortIcon('tipo_generacion')}
                        </th>
                        <th
                          className='cursor-pointer user-select-none'
                          onClick={() => handleSort('global_')}
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
                          Global {getSortIcon('global_')}
                        </th>
                        <th
                          className='cursor-pointer user-select-none'
                          onClick={() => handleSort('activo')}
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
                          Estado {getSortIcon('activo')}
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
                          Departamentos Asociados
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
                      {filteredMetadatos.map((metadato, index) => (
                        <tr
                          key={metadato.id}
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
                            {metadato.id}
                          </td>
                          <td style={{
                            ...getTableCellStyles(),
                            color: atisaStyles.colors.dark,
                            fontWeight: '600'
                          }}>
                            <div className='d-flex flex-column'>
                              <span className='fw-bold'>{metadato.nombre}</span>
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
                            {metadato.descripcion || '-'}
                          </td>
                          <td style={{
                            ...getTableCellStyles()
                          }}>
                            <span
                              className='badge'
                              style={getBadgeStyles(metadato.tipo_generacion === 'automatico')}
                            >
                              {metadato.tipo_generacion}
                            </span>
                          </td>
                          <td style={{
                            ...getTableCellStyles()
                          }}>
                            <span
                              className='badge'
                              style={getBadgeStyles(!!metadato.global_)}
                            >
                              {metadato.global_ ? 'Sí' : 'No'}
                            </span>
                          </td>
                          <td style={{
                            ...getTableCellStyles()
                          }}>
                            <span
                              className='badge'
                              style={getBadgeStyles(!!metadato.activo)}
                            >
                              {metadato.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td style={{
                            ...getTableCellStyles()
                          }}>
                            {metadato.global_ ? (
                              <span
                                style={{
                                  color: atisaStyles.colors.dark,
                                  fontStyle: 'italic',
                                  fontFamily: atisaStyles.fonts.secondary
                                }}
                              >
                                Global - Aplica a todos los departamentos
                              </span>
                            ) : (
                              <div className='d-flex flex-column gap-2' style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                {groupedMetadatosArea[metadato.id]?.map((ma) => (
                                  <div key={ma.id} className='d-flex align-items-center'>
                                    <span
                                      className='badge me-2'
                                      style={getBadgeStyles(true)}
                                    >
                                      {ma.subdepData.ceco || '-'}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '12px',
                                        fontFamily: atisaStyles.fonts.secondary,
                                        color: atisaStyles.colors.dark
                                      }}
                                    >
                                      {ma.subdepData.nombre || '-'}
                                    </span>
                                  </div>
                                ))}
                                {(!groupedMetadatosArea[metadato.id] || groupedMetadatosArea[metadato.id].length === 0) && (
                                  <span
                                    style={{
                                      color: atisaStyles.colors.dark,
                                      fontFamily: atisaStyles.fonts.secondary
                                    }}
                                  >
                                    Sin departamentos
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td
                            className='text-start'
                            style={{
                              ...getTableCellStyles()
                            }}
                          >
                            <div className='d-flex gap-2'>
                              {!metadato.global_ && (
                                <button
                                  className='btn btn-sm'
                                  onClick={() => handleAsignarDepartamentos(metadato)}
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
                                  <i className='bi bi-building me-2'></i>
                                  Asignar Departamentos
                                </button>
                              )}
                              <div className='dropdown-container' style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                  ref={(el) => (buttonRefs.current[metadato.id] = el)}
                                  className='btn btn-sm'
                                  type='button'
                                  onClick={(e) => handleActionsClick(metadato.id, e)}
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
                                  <i className={`bi ${activeDropdown === metadato.id ? 'bi-chevron-up' : 'bi-chevron-down'} ms-1`}></i>
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

              {filteredMetadatos.length > 0 && (
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
                  const metadato = metadatos.find(m => m.id === activeDropdown)
                  if (metadato) {
                    handleEdit(metadato)
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
                <i className="bi bi-pencil-square me-3" style={{ fontSize: '16px' }}></i>
                Editar
              </button>

              {(() => {
                const metadato = metadatos.find(m => m.id === activeDropdown)
                if (metadato && metadato.tipo_generacion !== 'automatico') {
                  return (
                    <>
                      <div style={{
                        height: '1px',
                        backgroundColor: atisaStyles.colors.light,
                        margin: '4px 0'
                      }}></div>

                      <button
                        onClick={() => {
                          handleDelete(activeDropdown)
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
                        <i className="bi bi-trash3 me-3" style={{ fontSize: '16px' }}></i>
                        Eliminar
                      </button>
                    </>
                  )
                }
                return null
              })()}
            </div>
          </div>,
          document.body
        )}
      </KTCard>

      <MetadatoModal
        show={showModal}
        onHide={() => {
          setShowModal(false)
          setEditingMetadato(null)
        }}
        onSave={handleSave}
        metadato={editingMetadato}
      />

      <MetadatoSubdepartamentosModal
        show={showSubdepartamentosModal}
        onHide={() => setShowSubdepartamentosModal(false)}
        onSave={handleSaveSubdepartamentos}
        metadatos={metadatos}
        subdepartamentos={subdepartamentos}
        areasActuales={metadatosArea}
        selectedMetadatoId={selectedMetadatoForAreas?.id || 0}
      />
    </div>
  )
}

export default MetadatosList
