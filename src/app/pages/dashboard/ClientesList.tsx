import React, { FC, useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { KTCard, KTCardBody } from '../../../_metronic/helpers'
import { Cliente, getAllClientes } from '../../api/clientes'
import { getAllPlantillas, Plantilla } from '../../api/plantillas'
import SharedPagination from '../../components/pagination/SharedPagination'
import ClienteProcesosModal from './components/ClienteProcesosModal'
import { GenerarCalendarioParams } from '../../api/clienteProcesos'
import { getAllProcesos, Proceso } from '../../api/procesos'
import { generarCalendarioClienteProceso } from '../../api/clienteProcesos'
import {atisaStyles, getPrimaryButtonStyles, getSecondaryButtonStyles, getTableHeaderStyles, getTableCellStyles, getActionsButtonStyles} from '../../styles/atisaStyles'

const ClientesList: FC = () => {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)
  const [total, setTotal] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [sortField, setSortField] = useState<string>('idcliente')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showModal, setShowModal] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [procesosList, setProcesosList] = useState<Proceso[]>([])
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({})
  const limit = 10

  useEffect(() => {
    loadInitialData()
    loadProcesos()
  }, [])

  useEffect(() => {
    loadClientes()
  }, [page, sortField, sortDirection])

  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    } else {
      loadClientes()
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
  const handleActionsClick = (clienteId: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (activeDropdown === clienteId) {
      setActiveDropdown(null)
      setDropdownPosition(null)
    } else {
      const position = calculateDropdownPosition(event.currentTarget)
      setActiveDropdown(clienteId)
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

  const loadInitialData = async () => {
    try {
      const plantillasData = await getAllPlantillas()
      setPlantillas(plantillasData.plantillas || [])
    } catch (error) {
      console.error('Error al cargar plantillas:', error)
    }
  }

  const loadClientes = async () => {
    try {
      setLoading(true)
      const data = await getAllClientes(page, limit, sortField, sortDirection)
      setClientes(data.clientes || [])
      setTotal(data.total)
    } catch (error) {
      setError('Error al cargar los clientes')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProcesos = async () => {
    try {
      const response = await getAllProcesos()
      setProcesosList(response.procesos || [])
    } catch (error) {
      console.error('Error al cargar procesos:', error)
    }
  }

  const filteredClientes = clientes.filter((cliente) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()

    return Object.values(cliente).some((value) =>
      value?.toString().toLowerCase().includes(searchLower)
    )
  })

  const handleOpenModal = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedCliente(null)
  }

  const handleSaveClienteProceso = async (calendarios: GenerarCalendarioParams[]) => {
    try {
      for (const calendario of calendarios) {
        await generarCalendarioClienteProceso(calendario)
      }
      handleCloseModal()
      loadClientes() // Recargar la lista después de guardar
    } catch (error) {
      console.error('Error al guardar los procesos:', error)
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
              Gestión de Clientes
            </h3>
            <div className='d-flex align-items-center position-relative my-3'>
              <i
                className='bi bi-search position-absolute ms-6'
                style={{ color: atisaStyles.colors.light }}
              ></i>
              <input
                type='text'
                className='form-control form-control-solid w-250px ps-14'
                placeholder='Buscar cliente...'
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
            <div className='d-flex justify-content-end'>
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
              {filteredClientes.length === 0 ? (
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
                    className='bi bi-people'
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
                    No hay clientes disponibles
                  </h4>
                  <p
                    style={{
                      fontFamily: atisaStyles.fonts.secondary,
                      color: atisaStyles.colors.dark,
                      margin: 0
                    }}
                  >
                    {searchTerm ? 'No se encontraron clientes que coincidan con tu búsqueda.' : 'No hay clientes registrados en el sistema.'}
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
                          onClick={() => handleSort('idcliente')}
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
                          ID {getSortIcon('idcliente')}
                        </th>
                        <th
                          className='cursor-pointer user-select-none'
                          onClick={() => handleSort('cif')}
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
                          CIF {getSortIcon('cif')}
                        </th>
                        <th
                          className='cursor-pointer user-select-none'
                          onClick={() => handleSort('razsoc')}
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
                          Razón Social {getSortIcon('razsoc')}
                        </th>
                        <th
                          className='cursor-pointer user-select-none'
                          onClick={() => handleSort('direccion')}
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
                          Dirección {getSortIcon('direccion')}
                        </th>
                        <th
                          className='cursor-pointer user-select-none'
                          onClick={() => handleSort('localidad')}
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
                          Localidad {getSortIcon('localidad')}
                        </th>
                        <th
                          className='cursor-pointer user-select-none'
                          onClick={() => handleSort('provincia')}
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
                          Provincia {getSortIcon('provincia')}
                        </th>
                        <th
                          className='cursor-pointer user-select-none'
                          onClick={() => handleSort('cpostal')}
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
                          C.P. {getSortIcon('cpostal')}
                        </th>
                        <th
                          className='cursor-pointer user-select-none'
                          onClick={() => handleSort('pais')}
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
                          País {getSortIcon('pais')}
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
                      {filteredClientes.map((cliente, index) => (
                        <tr
                          key={cliente.idcliente}
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
                            {cliente.idcliente}
                          </td>
                          <td style={{
                            ...getTableCellStyles(),
                            color: atisaStyles.colors.dark,
                            fontWeight: '600'
                          }}>
                            {cliente.cif || '-'}
                          </td>
                          <td style={{
                            ...getTableCellStyles(),
                            color: atisaStyles.colors.dark,
                            fontWeight: '600',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {cliente.razsoc || '-'}
                          </td>
                          <td style={{
                            ...getTableCellStyles(),
                            color: atisaStyles.colors.dark,
                            maxWidth: '150px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {cliente.direccion || '-'}
                          </td>
                          <td style={{
                            ...getTableCellStyles(),
                            color: atisaStyles.colors.dark
                          }}>
                            {cliente.localidad || '-'}
                          </td>
                          <td style={{
                            ...getTableCellStyles(),
                            color: atisaStyles.colors.dark
                          }}>
                            {cliente.provincia || '-'}
                          </td>
                          <td style={{
                            ...getTableCellStyles(),
                            color: atisaStyles.colors.dark
                          }}>
                            {cliente.cpostal || '-'}
                          </td>
                          <td style={{
                            ...getTableCellStyles(),
                            color: atisaStyles.colors.dark
                          }}>
                            {cliente.pais || '-'}
                          </td>
                          <td style={{
                            ...getTableCellStyles()
                          }}>
                            <div className='d-flex gap-2'>
                              <button
                                className='btn btn-sm'
                                onClick={() => handleOpenModal(cliente)}
                                style={{
                                  backgroundColor: atisaStyles.colors.secondary,
                                  border: `2px solid ${atisaStyles.colors.secondary}`,
                                  color: 'white',
                                  fontFamily: atisaStyles.fonts.secondary,
                                  fontWeight: '600',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
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
                                <i className='bi bi-plus-circle me-2'></i>
                                Generar Calendario
                              </button>
                              <button
                                className='btn btn-sm'
                                onClick={() => navigate(`/cliente-calendario/${cliente.idcliente}`)}
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
                                <i className='bi bi-eye me-2'></i>
                                Ver Calendario
                              </button>
                              <button
                                className='btn btn-sm'
                                onClick={() => navigate(`/editar-calendario/${cliente.idcliente}`)}
                                style={{
                                  backgroundColor: atisaStyles.colors.primary,
                                  border: `2px solid ${atisaStyles.colors.primary}`,
                                  color: 'white',
                                  fontFamily: atisaStyles.fonts.secondary,
                                  fontWeight: '600',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                                  e.currentTarget.style.borderColor = atisaStyles.colors.secondary
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                                  e.currentTarget.style.borderColor = atisaStyles.colors.primary
                                }}
                              >
                                <i className='bi bi-pencil-square me-2'></i>
                                Editar Calendario
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredClientes.length > 0 && (
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

        <ClienteProcesosModal
          show={showModal}
          onHide={handleCloseModal}
          onSave={handleSaveClienteProceso}
          plantillas={plantillas}
          selectedCliente={selectedCliente}
          procesosList={procesosList}
        />
      </KTCard>
    </div>
  )
}

export default ClientesList
