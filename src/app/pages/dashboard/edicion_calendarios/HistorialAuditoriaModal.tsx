import { FC, useEffect, useState } from 'react'
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { getAuditoriaCalendariosByCliente, AuditoriaCalendario } from '../../../api/auditoriaCalendarios'
import { atisaStyles } from '../../../styles/atisaStyles'
import SharedPagination from '../../../components/pagination/SharedPagination'

interface Props {
  show: boolean
  onHide: () => void
  hitoId?: number
  clienteId: string
}

const HistorialAuditoriaModal: FC<Props> = ({ show, onHide, hitoId, clienteId }) => {
  const [auditoria, setAuditoria] = useState<AuditoriaCalendario[]>([])
  const [loading, setLoading] = useState(false)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(6)


  useEffect(() => {
    if (show) {
      // Limpiar datos anteriores cuando se abre el modal
      setAuditoria([])
      setLoading(false)
      setCurrentPage(1)
      setTotalPages(1)
      setTotalItems(0)

      // Establecer fechas por defecto (último año) usando UTC
      const hoy = new Date()
      const haceUnAno = new Date(Date.UTC(hoy.getUTCFullYear() - 1, hoy.getUTCMonth(), hoy.getUTCDate()))

      setFechaDesde(haceUnAno.toISOString().split('T')[0])
      setFechaHasta(hoy.toISOString().split('T')[0])

      cargarAuditoria()
    }
  }, [show, clienteId])

  const cargarAuditoria = async (page: number = currentPage) => {
    setLoading(true)
    try {
      const data = await getAuditoriaCalendariosByCliente(
        clienteId,
        page,
        itemsPerPage,
        'fecha_modificacion',
        'desc',
        fechaDesde,
        fechaHasta
      )

      setAuditoria(data.auditoria_calendarios || [])
      setTotalItems(data.total)
      setTotalPages(Math.ceil(data.total / itemsPerPage))
      setCurrentPage(page)
    } catch (error) {
      console.error('Error cargando auditoría:', error)
      setAuditoria([])
      setTotalItems(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrar = () => {
    setCurrentPage(1)
    cargarAuditoria(1)
  }

  const handlePageChange = (page: number) => {
    cargarAuditoria(page)
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCampoNombre = (campo: string) => {
    const campos: Record<string, string> = {
      'fecha_inicio': 'Fecha de Inicio',
      'fecha_fin': 'Fecha Límite',
      'hora_limite': 'Hora Límite',
      'estado': 'Estado'
    }
    return campos[campo] || campo
  }

  return (
    <>
      <Modal
        show={show}
        onHide={onHide}
        fullscreen={true}
        centered
        style={{
          fontFamily: atisaStyles.fonts.secondary
        }}
      >
        <Modal.Header
          style={{
            backgroundColor: atisaStyles.colors.primary,
            color: 'white',
            border: 'none',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Modal.Title
            style={{
              fontFamily: atisaStyles.fonts.primary,
              fontWeight: 'bold',
              color: 'white',
              fontSize: '1.5rem',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <i className="bi bi-clock-history me-2" style={{ color: 'white' }}></i>
            Historial de Auditoría
          </Modal.Title>
          <div
            className='btn btn-icon btn-sm'
            onClick={onHide}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <i className="bi bi-x" style={{ color: 'white', fontSize: '16px' }}></i>
          </div>
        </Modal.Header>

        <Modal.Body style={{ padding: '24px' }}>
          {/* Filtros */}
          <div
            className="mb-4 p-3"
            style={{
              backgroundColor: atisaStyles.colors.light,
              borderRadius: '8px',
              border: `1px solid ${atisaStyles.colors.accent}`
            }}
          >
            <h6
              style={{
                fontFamily: atisaStyles.fonts.primary,
                color: atisaStyles.colors.primary,
                fontWeight: 'bold',
                marginBottom: '16px'
              }}
            >
              <i className="bi bi-funnel me-2"></i>
              Filtros
            </h6>

            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: '600' }}>
                  Fecha Desde
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  style={{
                    border: `1px solid ${atisaStyles.colors.light}`,
                    borderRadius: '6px'
                  }}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label" style={{ fontWeight: '600' }}>
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  style={{
                    border: `1px solid ${atisaStyles.colors.light}`,
                    borderRadius: '6px'
                  }}
                />
              </div>

              <div className="col-md-4 d-flex align-items-end">
                <button
                  className="btn w-100"
                  onClick={handleFiltrar}
                  style={{
                    backgroundColor: atisaStyles.colors.secondary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    padding: '8px 16px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                  }}
                >
                  <i className="bi bi-search me-2"></i>
                  Filtrar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de auditoría */}
          {loading ? (
            <div className="text-center py-4">
              <div
                className="spinner-border"
                role="status"
                style={{
                  color: atisaStyles.colors.primary,
                  width: '2rem',
                  height: '2rem'
                }}
              >
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2" style={{ color: atisaStyles.colors.dark }}>
                Cargando historial de auditoría...
              </p>
            </div>
          ) : auditoria.length === 0 ? (
            <div
              className="text-center py-5"
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: `2px dashed ${atisaStyles.colors.light}`
              }}
            >
              <i
                className="bi bi-info-circle"
                style={{
                  fontSize: '48px',
                  color: atisaStyles.colors.primary,
                  marginBottom: '16px'
                }}
              ></i>
              <h5 style={{ color: atisaStyles.colors.primary, marginBottom: '8px' }}>
                No hay registros de auditoría
              </h5>
              <p style={{ color: atisaStyles.colors.dark, margin: 0 }}>
                No se encontraron cambios registrados en el período seleccionado.
              </p>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
                border: `1px solid ${atisaStyles.colors.light}`,
                overflow: 'hidden'
              }}
            >
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
                      <th style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', backgroundColor: atisaStyles.colors.primary, color: 'white', whiteSpace: 'nowrap' }}>Cubo</th>
                      <th style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', backgroundColor: atisaStyles.colors.primary, color: 'white', whiteSpace: 'nowrap' }}>Proceso</th>
                      <th style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', backgroundColor: atisaStyles.colors.primary, color: 'white', whiteSpace: 'nowrap' }}>Hito</th>
                      <th style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', backgroundColor: atisaStyles.colors.primary, color: 'white', whiteSpace: 'nowrap' }}>Origen</th>
                      <th style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', backgroundColor: atisaStyles.colors.primary, color: 'white', whiteSpace: 'nowrap', textAlign: 'center' }}>Clave</th>
                      <th style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', backgroundColor: atisaStyles.colors.primary, color: 'white', whiteSpace: 'nowrap' }}>F/H Ant.</th>
                      <th style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', backgroundColor: atisaStyles.colors.primary, color: 'white', whiteSpace: 'nowrap' }}>F/H Act.</th>
                      <th style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', backgroundColor: atisaStyles.colors.primary, color: 'white', whiteSpace: 'nowrap' }}>Motivo</th>
                      <th style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', backgroundColor: atisaStyles.colors.primary, color: 'white', whiteSpace: 'nowrap' }}>F. Act.</th>
                      <th style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', backgroundColor: atisaStyles.colors.primary, color: 'white', whiteSpace: 'nowrap' }}>Usuario</th>
                      <th style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', fontSize: '14px', padding: '16px 12px', border: 'none', backgroundColor: atisaStyles.colors.primary, color: 'white', whiteSpace: 'nowrap', textAlign: 'center', width: '60px' }}>Obs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditoria.map((item, index) => (
                      <tr
                        key={item.id}
                        style={{
                          backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa'
                        }}
                      >
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <div style={{ fontWeight: '600' }}>{item.codSubDepar ? `${item.codSubDepar.substring(4)} - ${item.nombre_subdepar || '-'}` : (item.nombre_subdepar || '-')}</div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '500' }}>
                          <div style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.proceso_nombre}>
                            {item.proceso_nombre}
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600' }}>
                          <div style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.hito_nombre}>
                            {item.hito_nombre}
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <span className="badge" style={{ backgroundColor: 'rgba(0,161,222,0.1)', color: atisaStyles.colors.primary, border: `1px solid rgba(0,161,222,0.3)` }}>
                            {item.tipo || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', textAlign: 'center' }}>
                          {item.critico ? (
                            <i className="bi bi-star-fill text-warning" title="Hito Clave"></i>
                          ) : (
                            <i className="bi bi-dash text-muted" title="No Clave"></i>
                          )}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <code style={{ backgroundColor: '#f8f9fa', padding: '3px 6px', borderRadius: '4px', color: '#6c757d', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                            {item.fecha_limite_anterior || item.valor_anterior || '-'}
                          </code>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <code style={{ backgroundColor: '#e8f5e9', padding: '3px 6px', borderRadius: '4px', color: '#105021', border: '1px solid #c8e6c9', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                            {item.fecha_limite_actual || item.valor_nuevo || '-'}
                          </code>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <span style={{
                            backgroundColor: 'rgba(0,161,222,0.1)',
                            color: atisaStyles.colors.primary,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: `1px solid rgba(0,161,222,0.3)`,
                            whiteSpace: 'nowrap'
                          }}>
                            {item.motivo_descripcion || 'Configuración'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {formatDate(item.fecha_modificacion)}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600' }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }} title={(item.nombre_usuario || item.usuario)?.trim()}>
                            {(item.nombre_usuario || item.usuario)?.trim()}
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {item.observaciones ? (
                            <OverlayTrigger placement="top" overlay={<Tooltip id={`tooltip-obs-${item.id}`} style={{ maxWidth: '300px', zIndex: 9999 }}>{item.observaciones}</Tooltip>}>
                              <button type="button" className="btn btn-icon btn-sm" style={{ background: 'transparent', border: 'none', padding: 0, transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                <i className="bi bi-chat-square-text-fill" style={{ color: '#dc3545', fontSize: '20px' }}></i>
                              </button>
                            </OverlayTrigger>
                          ) : (
                            <i className="bi bi-chat-square" style={{ color: '#dee2e6', fontSize: '20px' }}></i>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Controles de paginación */}
          {auditoria.length > 0 && totalPages > 1 && (
            <div className="mt-4">
              <SharedPagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </Modal.Body>

        <Modal.Footer
          style={{
            backgroundColor: '#f8f9fa',
            border: 'none',
            padding: '16px 24px'
          }}
        >
          <button
            className="btn"
            onClick={onHide}
            style={{
              backgroundColor: atisaStyles.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              padding: '8px 16px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
            }}
          >
            <i className="bi bi-x-circle me-2"></i>
            Cerrar
          </button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default HistorialAuditoriaModal
