import { FC, useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { getAuditoriaCalendariosByCliente, AuditoriaCalendario } from '../../../../api/auditoriaCalendarios'
import { atisaStyles } from '../../../../styles/atisaStyles'
import SharedPagination from '../../../../components/pagination/SharedPagination'

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

  // Estilos CSS personalizados para el modal más grande
  const modalStyles = `
    .modal-historial-auditoria .modal-dialog {
      max-width: 99vw;
      width: 99vw;
      max-height: 98vh;
      margin: 1vh auto;
    }
    .modal-historial-auditoria .modal-content {
      height: 98vh;
      display: flex;
      flex-direction: column;
      border-radius: 16px;
      overflow: hidden;
    }
    .modal-historial-auditoria .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
    .modal-historial-auditoria .modal-header {
      flex-shrink: 0;
    }
    .modal-historial-auditoria .modal-footer {
      flex-shrink: 0;
    }
    .modal-historial-auditoria .table-responsive {
      max-height: 70vh;
      overflow-y: auto;
    }
    .modal-historial-auditoria .table {
      font-size: 14px;
    }
    .modal-historial-auditoria .table th {
      position: sticky;
      top: 0;
      z-index: 10;
      background-color: ${atisaStyles.colors.primary} !important;
    }
  `

  useEffect(() => {
    if (show) {
      // Limpiar datos anteriores cuando se abre el modal
      setAuditoria([])
      setLoading(false)
      setCurrentPage(1)
      setTotalPages(1)
      setTotalItems(0)

      // Establecer fechas por defecto (último año)
      const hoy = new Date()
      const haceUnAno = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate())

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
      <style>{modalStyles}</style>
      <Modal
        show={show}
        onHide={onHide}
        size="xl"
        centered
        dialogClassName="modal-historial-auditoria"
        style={{
          fontFamily: atisaStyles.fonts.secondary
        }}
      >
      <Modal.Header
        style={{
          backgroundColor: atisaStyles.colors.primary,
          color: 'white',
          border: 'none',
          borderRadius: '12px 12px 0 0',
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
          <div className="table-responsive">
            <table
              className="table table-hover"
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
                  <th style={{ border: 'none', padding: '12px' }}>Fecha</th>
                  <th style={{ border: 'none', padding: '12px' }}>Hito</th>
                  <th style={{ border: 'none', padding: '12px' }}>Campo</th>
                  <th style={{ border: 'none', padding: '12px' }}>Valor Anterior</th>
                  <th style={{ border: 'none', padding: '12px' }}>Valor Nuevo</th>
                  <th style={{ border: 'none', padding: '12px' }}>Usuario</th>
                  <th style={{ border: 'none', padding: '12px' }}>Observaciones</th>
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
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {formatDate(item.fecha_modificacion)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>
                      {item.nombre_hito}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <span
                        style={{
                          backgroundColor: atisaStyles.colors.accent,
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        {getCampoNombre(item.campo_modificado)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px', borderRadius: '3px' }}>
                        {item.valor_anterior || '-'}
                      </code>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <code style={{ backgroundColor: '#d4edda', padding: '2px 4px', borderRadius: '3px' }}>
                        {item.valor_nuevo || '-'}
                      </code>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>
                      {item.usuario_modificacion}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {item.observaciones || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
