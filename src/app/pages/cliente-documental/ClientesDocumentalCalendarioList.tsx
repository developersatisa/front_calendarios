import {FC, useState, useEffect} from 'react'
import {KTCard, KTCardBody} from '../../../_metronic/helpers'
import {Cliente, getAllClientes} from '../../api/clientes'
import SharedPagination from '../../components/pagination/SharedPagination'
import {useNavigate} from 'react-router-dom'
import { atisaStyles } from '../../styles/atisaStyles'

const ClientesDocumentalCalendarioList: FC = () => {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10
  const [allClientes, setAllClientes] = useState<Cliente[]>([])
  const [sortField, setSortField] = useState<string>('idcliente')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Cargar todos los clientes al inicio
  useEffect(() => {
    loadAllClientes()
  }, [])

  // Cargar la página actual
  useEffect(() => {
    if (!searchTerm) {
      loadClientes()
    }
  }, [page, sortField, sortDirection])

  const loadAllClientes = async () => {
    try {
      const response = await getAllClientes() // Sin parámetros para obtener todos
      setAllClientes(response.clientes || [])
    } catch (error) {
      console.error('Error al cargar todos los clientes:', error)
    }
  }

  const loadClientes = async () => {
    try {
      setLoading(true)
      const response = await getAllClientes(page, limit, sortField, sortDirection)
      setClientes(response.clientes || [])
      setTotal(response.total || 0)
    } catch (error) {
      setError('Error al cargar las empresas')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    if (value) {
      // Filtrar de todos los clientes
      const filtered = allClientes.filter((cliente) => {
        const searchLower = value.toLowerCase()
        return (
          cliente.idcliente.toLowerCase().includes(searchLower) ||
          (cliente.razsoc?.toLowerCase().includes(searchLower) || false) ||
          (cliente.cif?.toLowerCase().includes(searchLower) || false) ||
          (cliente.localidad?.toLowerCase().includes(searchLower) || false)
        )
      })
      setClientes(filtered)
      setTotal(filtered.length)
    } else {
      // Si no hay término de búsqueda, volver a la paginación normal
      loadClientes()
    }
  }

  const handleCalendarClick = (clienteId: string) => {
    navigate(`/cliente-calendario/${clienteId}`)
  }

  return (
    <>
      <style>
        {`
          .tooltip-text {
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
          }
          .btn:hover + .tooltip-text {
            opacity: 1;
          }
        `}
      </style>
      <div
        className="container-fluid py-5"
        style={{
          fontFamily: atisaStyles.fonts.secondary,
          backgroundColor: '#f8f9fa',
          minHeight: '100vh'
        }}
      >
      <div
        className='text-center mb-8'
        style={{
          backgroundColor: atisaStyles.colors.primary,
          color: 'white',
          padding: '32px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.15)',
          marginBottom: '24px'
        }}
      >
        <h1
          style={{
            fontFamily: atisaStyles.fonts.primary,
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            fontSize: '2.5rem'
          }}
        >
          <i className="bi bi-building me-3" style={{ color: 'white' }}></i>
          Gestor Documental/Calendario
        </h1>
        <h4
          style={{
            fontFamily: atisaStyles.fonts.secondary,
            color: atisaStyles.colors.light,
            margin: '8px 0 0 0',
            fontSize: '1.2rem',
            fontWeight: '500'
          }}
        >
          Directorio de empresas
        </h4>
      </div>

      <div
        className='mb-6'
        style={{
          backgroundColor: 'white',
          padding: '20px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
          border: `1px solid ${atisaStyles.colors.light}`
        }}
      >
        <div className='input-group'>
          <input
            type='text'
            className='form-control'
            placeholder='Buscar por ID, razón social, CIF o localidad...'
            value={searchTerm}
            onChange={handleSearch}
            style={{
              fontFamily: atisaStyles.fonts.secondary,
              fontSize: '14px',
              padding: '12px 16px',
              height: '48px',
              border: `2px solid ${atisaStyles.colors.light}`,
              borderRadius: '8px 0 0 8px',
              transition: 'all 0.3s ease',
              backgroundColor: 'white'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = atisaStyles.colors.accent
              e.target.style.boxShadow = `0 0 0 3px ${atisaStyles.colors.accent}20`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = atisaStyles.colors.light
              e.target.style.boxShadow = 'none'
            }}
          />
          <button
            className='btn btn-primary'
            type='button'
            style={{
              backgroundColor: atisaStyles.colors.secondary,
              border: `2px solid ${atisaStyles.colors.secondary}`,
              borderRadius: '0 8px 8px 0',
              height: '48px',
              padding: '0 20px',
              fontFamily: atisaStyles.fonts.secondary,
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
              e.currentTarget.style.borderColor = atisaStyles.colors.accent
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
              e.currentTarget.style.borderColor = atisaStyles.colors.secondary
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <i className='bi bi-search' style={{ fontSize: '16px' }}></i>
          </button>
        </div>
      </div>

      <div
        className='table-responsive'
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
          border: `1px solid ${atisaStyles.colors.light}`,
          overflow: 'hidden'
        }}
      >
        <table
          className='table table-hover table-rounded table-striped border gy-7 gs-7'
          style={{
            fontFamily: atisaStyles.fonts.secondary,
            margin: 0
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: atisaStyles.colors.primary,
                color: 'white'
              }}
            >
              <th
                className='cursor-pointer user-select-none'
                onClick={() => handleSort('idcliente')}
                style={{
                  transition: 'all 0.2s',
                  fontFamily: atisaStyles.fonts.primary,
                  fontWeight: 'bold',
                  fontSize: '14px',
                  padding: '16px 12px',
                  border: 'none',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                }}
              >
                ID {getSortIcon('idcliente')}
              </th>
              <th
                className='cursor-pointer user-select-none'
                onClick={() => handleSort('razsoc')}
                style={{
                  transition: 'all 0.2s',
                  fontFamily: atisaStyles.fonts.primary,
                  fontWeight: 'bold',
                  fontSize: '14px',
                  padding: '16px 12px',
                  border: 'none',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                }}
              >
                Empresa {getSortIcon('razsoc')}
              </th>
              <th
                className='text-end'
                style={{
                  fontFamily: atisaStyles.fonts.primary,
                  fontWeight: 'bold',
                  fontSize: '14px',
                  padding: '16px 12px',
                  border: 'none',
                  color: 'white'
                }}
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente, index) => (
              <tr
                key={cliente.idcliente}
                style={{
                  backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
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
                <td
                  style={{
                    fontFamily: atisaStyles.fonts.secondary,
                    color: atisaStyles.colors.primary,
                    fontWeight: '600',
                    padding: '16px 12px'
                  }}
                >
                  {cliente.idcliente}
                </td>
                <td
                  style={{
                    fontFamily: atisaStyles.fonts.secondary,
                    color: atisaStyles.colors.dark,
                    padding: '16px 12px'
                  }}
                >
                  {cliente.razsoc || cliente.idcliente}
                </td>
                <td className='text-end' style={{ padding: '16px 12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      justifyContent: 'flex-end',
                      alignItems: 'center'
                    }}
                  >
                    {/* Botón Calendario */}
                    <div style={{ position: 'relative' }}>
                      <button
                        className='btn btn-icon'
                        title='Ver Calendario'
                        onClick={() => handleCalendarClick(cliente.idcliente)}
                        style={{
                          backgroundColor: atisaStyles.colors.secondary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          width: '42px',
                          height: '42px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          fontFamily: atisaStyles.fonts.secondary,
                          boxShadow: '0 2px 8px rgba(156, 186, 57, 0.3)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 161, 222, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                          e.currentTarget.style.transform = 'translateY(0) scale(1)'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(156, 186, 57, 0.3)'
                        }}
                      >
                        <i className='bi bi-calendar3' style={{ fontSize: '18px', color: 'white' }}></i>
                      </button>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-25px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: atisaStyles.colors.primary,
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontFamily: atisaStyles.fonts.secondary,
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          pointerEvents: 'none',
                          zIndex: 1000
                        }}
                        className="tooltip-text"
                      >
                        Calendario
                      </div>
                    </div>

                    {/* Botón Gestor Documental */}
                    <div style={{ position: 'relative' }}>
                      <button
                        className='btn btn-icon'
                        title='Gestor Documental'
                        onClick={() => navigate(`/gestor-documental/${cliente.idcliente}`)}
                        style={{
                          backgroundColor: atisaStyles.colors.accent,
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          width: '42px',
                          height: '42px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          fontFamily: atisaStyles.fonts.secondary,
                          boxShadow: '0 2px 8px rgba(0, 161, 222, 0.3)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 80, 92, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                          e.currentTarget.style.transform = 'translateY(0) scale(1)'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 161, 222, 0.3)'
                        }}
                      >
                        <i className="bi bi-folder2-open" style={{ fontSize: '18px', color: 'white' }}></i>
                      </button>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-25px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: atisaStyles.colors.primary,
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontFamily: atisaStyles.fonts.secondary,
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          pointerEvents: 'none',
                          zIndex: 1000
                        }}
                        className="tooltip-text"
                      >
                        Documentos
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mostrar paginación siempre que haya datos */}
      {!loading && !error && clientes.length > 0 && (
        <div className='d-flex justify-content-end mt-5'>
          <SharedPagination
            currentPage={page}
            totalItems={total}
            pageSize={limit}
            onPageChange={setPage}
          />
        </div>
      )}

      {loading && (
        <div
          className='text-center py-4'
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
            border: `1px solid ${atisaStyles.colors.light}`,
            padding: '40px 24px'
          }}
        >
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
          <div
            style={{
              fontFamily: atisaStyles.fonts.secondary,
              color: atisaStyles.colors.dark,
              marginTop: '16px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Cargando empresas...
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            color: '#721c24',
            padding: '20px',
            borderRadius: '12px',
            fontFamily: atisaStyles.fonts.secondary,
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)'
          }}
        >
          <i className="bi bi-exclamation-triangle me-3" style={{ fontSize: '20px', color: '#721c24' }}></i>
          {error}
        </div>
      )}

      {!loading && !error && clientes.length === 0 && (
        <div
          className='text-center py-4'
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
            border: `1px solid ${atisaStyles.colors.light}`,
            padding: '40px 24px'
          }}
        >
          <i
            className="bi bi-building"
            style={{
              fontSize: '48px',
              color: atisaStyles.colors.light,
              marginBottom: '16px'
            }}
          ></i>
          <div
            style={{
              fontFamily: atisaStyles.fonts.secondary,
              color: atisaStyles.colors.dark,
              fontSize: '18px',
              fontWeight: '500'
            }}
          >
            No se encontraron empresas
          </div>
          <div
            style={{
              fontFamily: atisaStyles.fonts.secondary,
              color: atisaStyles.colors.light,
              fontSize: '14px',
              marginTop: '8px'
            }}
          >
            Intenta ajustar los filtros de búsqueda
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default ClientesDocumentalCalendarioList
