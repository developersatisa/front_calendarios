import { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { atisaStyles } from '../../../../styles/atisaStyles'
import SharedPagination from '../../../../components/pagination/SharedPagination'
import { getClienteProcesoHitoCumplimientosByCliente, ClienteProcesoHitoCumplimiento } from '../../../../api/clienteProcesoHitoCumplimientos'
import { Cliente, getClienteById } from '../../../../api/clientes'

// Extendemos la interfaz para incluir los campos adicionales que devuelve el endpoint
interface CumplimientoHistorico extends ClienteProcesoHitoCumplimiento {
  proceso?: string
  hito?: string
  fecha_limite?: string
}

interface Props {
  clienteId: string
}

const HistoricoCumplimientos: FC<Props> = ({ clienteId }) => {
  const navigate = useNavigate()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [cumplimientos, setCumplimientos] = useState<CumplimientoHistorico[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Función para cargar cumplimientos
  const cargarCumplimientos = async (page: number = 1) => {
    setLoading(true)
    try {
      const response = await getClienteProcesoHitoCumplimientosByCliente(
        clienteId,
        page,
        itemsPerPage,
        'fecha',
        'desc'
      )
      setCumplimientos(response.cumplimientos || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error('Error cargando cumplimientos:', error)
      setCumplimientos([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clienteId) {
      getClienteById(clienteId).then(setCliente)
      cargarCumplimientos(currentPage)
    }
  }, [clienteId, currentPage])

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }


  const formatTime = (time: string) => {
    if (!time) return '-'

    // Si ya está en formato HH:MM, devolverlo tal como está
    if (time.match(/^\d{2}:\d{2}$/)) {
      return time
    }

    // Si viene en formato HH:MM:SS, quitar los segundos
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return time.substring(0, 5)
    }

    return time
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div
        className="historico-cumplimientos-container"
        style={{
          fontFamily: atisaStyles.fonts.secondary,
          backgroundColor: '#f8f9fa',
          minHeight: '100vh',
          padding: '2rem'
        }}
      >
      {/* Header */}
      <div
        style={{
          backgroundColor: atisaStyles.colors.primary,
          color: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.15)',
          marginBottom: '2rem',
          textAlign: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h2
              style={{
                fontFamily: atisaStyles.fonts.primary,
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                fontSize: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
            >
              <i className="bi bi-clock-history" style={{ color: 'white' }}></i>
              Histórico de Cumplimientos
            </h2>
            <p
              style={{
                margin: '8px 0 0 0',
                fontSize: '1.1rem',
                opacity: 0.9
              }}
            >
              {cliente?.razsoc || clienteId}
            </p>
          </div>

          <button
            className="btn"
            onClick={() => navigate(`/cliente-calendario/${clienteId}`)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              fontFamily: atisaStyles.fonts.secondary,
              fontWeight: '600',
              padding: '12px 20px',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <i className="bi bi-calendar3" style={{ color: 'white' }}></i>
            Ver Calendario
          </button>
        </div>
      </div>

      {/* Tabla de cumplimientos */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
          border: `1px solid ${atisaStyles.colors.light}`,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            borderBottom: `1px solid ${atisaStyles.colors.light}`,
            backgroundColor: atisaStyles.colors.light
          }}
        >
          <h3
            style={{
              fontFamily: atisaStyles.fonts.primary,
              color: atisaStyles.colors.primary,
              fontWeight: 'bold',
              margin: 0,
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className="bi bi-list-ul" style={{ color: atisaStyles.colors.primary }}></i>
            Listado de Cumplimientos
          </h3>
        </div>

        <div className="table-responsive">
          <table
            className="table table-hover"
            style={{
              fontFamily: atisaStyles.fonts.secondary,
              margin: 0
            }}
          >
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <tr
                style={{
                  backgroundColor: atisaStyles.colors.primary,
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                            <th
                              style={{
                                fontFamily: atisaStyles.fonts.primary,
                                fontWeight: 'bold',
                                fontSize: '14px',
                                padding: '16px 12px',
                                border: 'none',
                                color: 'white'
                              }}
                            >
                              Fecha Cumplimiento
                            </th>
                            <th
                              style={{
                                fontFamily: atisaStyles.fonts.primary,
                                fontWeight: 'bold',
                                fontSize: '14px',
                                padding: '16px 12px',
                                border: 'none',
                                color: 'white'
                              }}
                            >
                              Hora Cumplimiento
                            </th>
                            <th
                              style={{
                                fontFamily: atisaStyles.fonts.primary,
                                fontWeight: 'bold',
                                fontSize: '14px',
                                padding: '16px 12px',
                                border: 'none',
                                color: 'white'
                              }}
                            >
                              Fecha Límite Hito
                            </th>
                <th
                  style={{
                    fontFamily: atisaStyles.fonts.primary,
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '16px 12px',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  Usuario
                </th>
                <th
                  style={{
                    fontFamily: atisaStyles.fonts.primary,
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '16px 12px',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  Proceso
                </th>
                <th
                  style={{
                    fontFamily: atisaStyles.fonts.primary,
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '16px 12px',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  Hito
                </th>
                <th
                  style={{
                    fontFamily: atisaStyles.fonts.primary,
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '16px 12px',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  Observación
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-4"
                    style={{
                      backgroundColor: '#f8f9fa',
                      fontFamily: atisaStyles.fonts.secondary,
                      padding: '2rem'
                    }}
                  >
                    <div
                      className="spinner-border"
                      role="status"
                      style={{
                        color: atisaStyles.colors.primary,
                        width: '2rem',
                        height: '2rem'
                      }}
                    >
                      <span className="visually-hidden">Cargando cumplimientos...</span>
                    </div>
                    <span
                      className="ms-2"
                      style={{
                        color: atisaStyles.colors.dark,
                        fontFamily: atisaStyles.fonts.secondary,
                        fontWeight: '500'
                      }}
                    >
                      Cargando cumplimientos...
                    </span>
                  </td>
                </tr>
              ) : cumplimientos.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-4"
                    style={{
                      backgroundColor: '#f8f9fa',
                      fontFamily: atisaStyles.fonts.secondary,
                      padding: '2rem',
                      color: atisaStyles.colors.dark
                    }}
                  >
                    <i className="bi bi-info-circle me-2" style={{ color: atisaStyles.colors.dark }}></i>
                    No hay cumplimientos registrados para este cliente
                  </td>
                </tr>
              ) : (
                cumplimientos.map((cumplimiento, index) => (
                  <tr
                    key={cumplimiento.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e9ecef'
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
                      {formatDate(cumplimiento.fecha)}
                    </td>
                    <td
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        color: atisaStyles.colors.dark,
                        padding: '16px 12px'
                      }}
                    >
                      {formatTime(cumplimiento.hora)}
                    </td>
                    <td
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        color: atisaStyles.colors.primary,
                        fontWeight: '600',
                        padding: '16px 12px'
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: '#e8f5e8',
                          color: '#2e7d32',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: '1px solid #c8e6c9',
                          boxShadow: '0 1px 3px rgba(46, 125, 50, 0.1)'
                        }}
                        title={cumplimiento.fecha_limite ? formatDate(cumplimiento.fecha_limite) : 'No disponible'}
                      >
                        {cumplimiento.fecha_limite ? formatDate(cumplimiento.fecha_limite) : 'No disponible'}
                      </span>
                    </td>
                    <td
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        color: atisaStyles.colors.dark,
                        padding: '16px 12px'
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: atisaStyles.colors.light,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        {cumplimiento.usuario}
                      </span>
                    </td>
                    <td
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        color: atisaStyles.colors.dark,
                        padding: '16px 12px'
                      }}
                    >
                      <span title={cumplimiento.proceso || 'No disponible'}>
                        {cumplimiento.proceso || 'No disponible'}
                      </span>
                    </td>
                    <td
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        color: atisaStyles.colors.primary,
                        fontWeight: '600',
                        padding: '16px 12px'
                      }}
                    >
                      <span title={cumplimiento.hito || 'No disponible'}>
                        {cumplimiento.hito || 'No disponible'}
                      </span>
                    </td>
                    <td
                      style={{
                        fontFamily: atisaStyles.fonts.secondary,
                        color: atisaStyles.colors.dark,
                        padding: '16px 12px'
                      }}
                    >
                      {cumplimiento.observacion ? (
                        <span
                          style={{
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                          title={cumplimiento.observacion}
                        >
                          {cumplimiento.observacion.length > 50
                            ? `${cumplimiento.observacion.substring(0, 50)}...`
                            : cumplimiento.observacion
                          }
                        </span>
                      ) : (
                        <span
                          style={{
                            color: '#6c757d',
                            fontStyle: 'italic',
                            fontSize: '12px'
                          }}
                        >
                          Sin observación
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {total > itemsPerPage && (
          <div
            style={{
              padding: '1.5rem',
              borderTop: `1px solid ${atisaStyles.colors.light}`,
              backgroundColor: '#f8f9fa'
            }}
          >
            <SharedPagination
              currentPage={currentPage}
              totalItems={total}
              pageSize={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoricoCumplimientos
