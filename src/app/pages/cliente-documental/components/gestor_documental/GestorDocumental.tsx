import React, { FC, useEffect, useState } from 'react'
import { KTCard, KTCardBody } from '../../../../../_metronic/helpers'
import { DocumentalCategoria, getDocumentalCategoriasByClienteId } from '../../../../api/documentalCategorias'
import { Cliente, getClienteById } from '../../../../api/clientes'
import CategorizarDocumentoModal from './CategorizarDocumentoModal'
import DocumentosCategoriaList from './DocumentosCategoriaList'
import CrearCategoriaModal from './CrearCategoriaModal'
import { atisaStyles } from '../../../../styles/atisaStyles'
import { useNavigate } from 'react-router-dom'

interface Props {
  clienteId: string
}

const GestorDocumental: FC<Props> = ({ clienteId }) => {
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState<DocumentalCategoria[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [showCategorizarModal, setShowCategorizarModal] = useState<boolean>(false)
  const [showDocumentosModal, setShowDocumentosModal] = useState<boolean>(false)
  const [showCrearCategoriaModal, setShowCrearCategoriaModal] = useState<boolean>(false)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<DocumentalCategoria | null>(null)

  useEffect(() => {
    loadCategorias()
    loadCliente()
  }, [clienteId])

  const loadCliente = async () => {
    try {
      const clienteData = await getClienteById(clienteId)
      setCliente(clienteData)
    } catch (err) {
      console.error('Error al cargar cliente:', err)
    }
  }

  const loadCategorias = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDocumentalCategoriasByClienteId(clienteId)
      setCategorias(data.documental_categorias)
    } catch (err) {
      console.error('Error al cargar categorías de documentos:', err)
      setError('Error al cargar las categorías de documentos')
    } finally {
      setLoading(false)
    }
  }

  const handleAñadirDocumento = (categoriaId: number) => {
    const categoria = categorias.find(cat => cat.id === categoriaId)
    if (categoria) {
      setCategoriaSeleccionada(categoria)
      setShowCategorizarModal(true)
    }
  }

  const handleVerDocumentos = (categoria: DocumentalCategoria) => {
    setCategoriaSeleccionada(categoria)
    setShowDocumentosModal(true)
  }

  const handleCloseCategorizarModal = () => {
    setShowCategorizarModal(false)
    setCategoriaSeleccionada(null)
  }

  const handleCloseDocumentosModal = () => {
    setShowDocumentosModal(false)
    setCategoriaSeleccionada(null)
  }

  const handleCloseCrearCategoriaModal = () => {
    setShowCrearCategoriaModal(false)
  }

  const handleCategoriaCreated = () => {
    // Recargar las categorías después de crear una nueva
    loadCategorias()
  }

  const handleUploadSuccess = () => {
    // Aquí puedes agregar lógica adicional como recargar datos, mostrar notificación, etc.
  }

  const handleVolver = () => {
    navigate(`/cliente-documental/calendario/${clienteId}`)
  }

  if (loading) {
    return (
      <div
        style={{
          fontFamily: atisaStyles.fonts.secondary,
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
          border: `1px solid ${atisaStyles.colors.light}`,
          padding: '40px 24px',
          textAlign: 'center'
        }}
      >
        <div
          className="spinner-border"
          role="status"
          style={{
            color: atisaStyles.colors.primary,
            width: '3rem',
            height: '3rem'
          }}
        >
          <span className="visually-hidden">Cargando...</span>
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
          Cargando categorías...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          fontFamily: atisaStyles.fonts.secondary,
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
          border: `1px solid ${atisaStyles.colors.light}`,
          padding: '24px'
        }}
      >
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
            boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
            marginBottom: '20px'
          }}
        >
          <i className="bi bi-exclamation-triangle me-3" style={{ fontSize: '20px', color: '#721c24' }}></i>
          <div>
            <h4 style={{ fontFamily: atisaStyles.fonts.primary, fontWeight: 'bold', margin: '0 0 8px 0' }}>Error</h4>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button
            className="btn"
            onClick={loadCategorias}
            style={{
              backgroundColor: atisaStyles.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontFamily: atisaStyles.fonts.secondary,
              fontWeight: '600',
              padding: '10px 20px',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <i className="bi bi-arrow-clockwise me-2" style={{ fontSize: '14px', color: 'white' }}></i>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="d-flex flex-column"
      style={{
        fontFamily: atisaStyles.fonts.secondary
      }}
    >
      {/* Header con botón de volver */}
      <div
        style={{
          backgroundColor: atisaStyles.colors.primary,
          color: 'white',
          padding: '32px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.15)',
          marginBottom: '24px',
          position: 'relative'
        }}
      >
        {/* Botón de volver */}
        <button
          className="btn"
          onClick={handleVolver}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontFamily: atisaStyles.fonts.secondary,
            fontWeight: '600',
            padding: '8px 16px',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <i className="bi bi-arrow-left" style={{ color: 'white' }}></i>
          Volver al Calendario
        </button>

        {/* Título principal */}
        <div className="text-center">
          <h1
            style={{
              fontFamily: atisaStyles.fonts.primary,
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              fontSize: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <i className="bi bi-folder2-open" style={{ color: 'white' }}></i>
            Gestor Documental {cliente?.razsoc || clienteId}
          </h1>
        </div>
      </div>

      {/* Container principal */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
          border: `1px solid ${atisaStyles.colors.light}`,
          padding: '32px 24px'
        }}
      >
        {/* Botón para agregar nueva categoría cuando ya existen categorías */}
        {categorias.length > 0 && (
          <div className="d-flex justify-content-end mb-6">
            <button
              className="btn"
              onClick={() => setShowCrearCategoriaModal(true)}
              style={{
                backgroundColor: atisaStyles.colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontFamily: atisaStyles.fonts.secondary,
                fontWeight: '600',
                padding: '10px 20px',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(156, 186, 57, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 161, 222, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(156, 186, 57, 0.3)'
              }}
            >
              <i className="bi bi-folder-plus fs-6 me-2" style={{ color: 'white' }}></i>
              Nueva Categoría
            </button>
          </div>
        )}

        {/* Lista de categorías */}
        <div className="d-flex flex-column gap-4">
          {categorias.map((categoria, index) => (
            <div key={categoria.id}>
              {/* Fila de categoría */}
              <div
                className="d-flex align-items-center justify-content-between py-4 px-4 rounded"
                style={{
                  backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                  border: `1px solid ${atisaStyles.colors.light}`,
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 80, 92, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 80, 92, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 80, 92, 0.05)'
                }}
              >
                {/* Lado izquierdo: Icono + Nombre */}
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: atisaStyles.colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16px',
                      boxShadow: '0 4px 12px rgba(0, 80, 92, 0.2)'
                    }}
                  >
                    <i className="bi bi-folder fs-4" style={{ color: 'white' }}></i>
                  </div>
                  <div>
                    <h3
                      style={{
                        fontFamily: atisaStyles.fonts.primary,
                        fontWeight: 'bold',
                        color: atisaStyles.colors.primary,
                        fontSize: '1.2rem',
                        margin: 0
                      }}
                    >
                      {categoria.nombre}
                    </h3>
                  </div>
                </div>

                <div className='d-flex gap-3'>
                  <button
                    className="btn"
                    onClick={() => handleAñadirDocumento(categoria.id)}
                    style={{
                      backgroundColor: atisaStyles.colors.accent,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontFamily: atisaStyles.fonts.secondary,
                      fontWeight: '600',
                      padding: '8px 16px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0, 161, 222, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = atisaStyles.colors.primary
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 80, 92, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 161, 222, 0.3)'
                    }}
                  >
                    <i className="bi bi-file-arrow-up fs-6 me-2" style={{ color: 'white' }}></i>
                    Añadir documento
                  </button>
                  <button
                    className="btn"
                    onClick={() => handleVerDocumentos(categoria)}
                    style={{
                      backgroundColor: atisaStyles.colors.secondary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontFamily: atisaStyles.fonts.secondary,
                      fontWeight: '600',
                      padding: '8px 16px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(156, 186, 57, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 161, 222, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(156, 186, 57, 0.3)'
                    }}
                  >
                    <i className="bi bi-eye fs-6 me-2" style={{ color: 'white' }}></i>
                    Ver Documentos
                  </button>
                </div>
              </div>

              {/* Separador entre elementos */}
              {index < categorias.length - 1 && (
                <div
                  style={{
                    height: '1px',
                    backgroundColor: atisaStyles.colors.light,
                    margin: '20px 0'
                  }}
                ></div>
              )}
            </div>
          ))}
        </div>

        {/* Mensaje cuando no hay categorías */}
        {categorias.length === 0 && (
          <div
            className="text-center py-10"
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
              border: `1px solid ${atisaStyles.colors.light}`,
              padding: '40px 24px'
            }}
          >
            <i
              className="bi bi-folder-x"
              style={{
                fontSize: '48px',
                color: atisaStyles.colors.light,
                marginBottom: '16px'
              }}
            ></i>
            <h3
              style={{
                fontFamily: atisaStyles.fonts.primary,
                color: atisaStyles.colors.primary,
                fontWeight: 'bold',
                fontSize: '1.5rem',
                margin: '0 0 16px 0'
              }}
            >
              No hay categorías disponibles
            </h3>
            <p
              style={{
                fontFamily: atisaStyles.fonts.secondary,
                color: atisaStyles.colors.dark,
                fontSize: '16px',
                margin: '0 0 24px 0'
              }}
            >
              No se encontraron categorías de documentos para mostrar.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <button
                className="btn"
                onClick={() => setShowCrearCategoriaModal(true)}
                style={{
                  backgroundColor: atisaStyles.colors.secondary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontWeight: '600',
                  padding: '12px 24px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(156, 186, 57, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 161, 222, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(156, 186, 57, 0.3)'
                }}
              >
                <i className="bi bi-folder-plus fs-6 me-2" style={{ color: 'white' }}></i>
                Crear Nueva Categoría
              </button>
              <button
                className="btn"
                onClick={loadCategorias}
                style={{
                  backgroundColor: 'transparent',
                  color: atisaStyles.colors.dark,
                  border: `2px solid ${atisaStyles.colors.light}`,
                  borderRadius: '8px',
                  fontFamily: atisaStyles.fonts.secondary,
                  fontWeight: '600',
                  padding: '12px 24px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                  e.currentTarget.style.color = atisaStyles.colors.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = atisaStyles.colors.dark
                }}
              >
                <i className="bi bi-arrow-clockwise fs-6 me-2" style={{ color: atisaStyles.colors.dark }}></i>
                Actualizar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para categorizar documentos */}
      {categoriaSeleccionada && (
        <CategorizarDocumentoModal
          show={showCategorizarModal}
          onHide={handleCloseCategorizarModal}
          categoriaId={categoriaSeleccionada.id}
          categoriaNombre={categoriaSeleccionada.nombre}
          clienteId={clienteId}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* Modal para mostrar lista de documentos */}
      {categoriaSeleccionada && (
        <DocumentosCategoriaList
          show={showDocumentosModal}
          onHide={handleCloseDocumentosModal}
          categoriaId={categoriaSeleccionada.id}
          categoriaNombre={categoriaSeleccionada.nombre}
          clienteId={clienteId}
        />
      )}

      {/* Modal para crear nueva categoría */}
      <CrearCategoriaModal
        show={showCrearCategoriaModal}
        onHide={handleCloseCrearCategoriaModal}
        clienteId={clienteId}
        onSuccess={handleCategoriaCreated}
      />
    </div>
  )
}

export default GestorDocumental
