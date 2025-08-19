import React, { FC, useEffect, useState } from 'react'
import { KTCard, KTCardBody } from '../../../../../_metronic/helpers'
import { DocumentalCategoria, getAllDocumentalCategorias } from '../../../../api/documentalCategorias'
import { Cliente, getClienteById } from '../../../../api/clientes'
import CategorizarDocumentoModal from './CategorizarDocumentoModal'
import DocumentosCategoriaList from './DocumentosCategoriaList'
import CrearCategoriaModal from './CrearCategoriaModal'

interface Props {
  clienteId: string
}

const GestorDocumental: FC<Props> = ({ clienteId }) => {
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
      const data = await getAllDocumentalCategorias()
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
    console.log('Documentos subidos exitosamente')
    // Aquí puedes agregar lógica adicional como recargar datos, mostrar notificación, etc.
  }

  if (loading) {
    return (
      <KTCard>
        <KTCardBody>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '150px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        </KTCardBody>
      </KTCard>
    )
  }

  if (error) {
    return (
      <KTCard>
        <KTCardBody>
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle fs-2hx text-danger me-4"></i>
            <div>
              <h4 className="alert-heading">Error</h4>
              <p className="mb-0">{error}</p>
            </div>
          </div>
          <div className="text-center">
            <button className="btn btn-primary" onClick={loadCategorias}>
              Reintentar
            </button>
          </div>
        </KTCardBody>
      </KTCard>
    )
  }

  return (
    <div className="d-flex flex-column">
      {/* Título principal */}
      <div className="text-center mb-10">
        <h1 className="fs-1 fw-bold text-gray-900">
          Gestor Documental {cliente?.razsoc || clienteId}
        </h1>
      </div>

      {/* Container principal */}
      <KTCard>
        <KTCardBody className="py-10">
          {/* Lista de categorías */}
          <div className="d-flex flex-column gap-5">
            {categorias.map((categoria, index) => (
              <div key={categoria.id}>
                {/* Fila de categoría */}
                <div className="d-flex align-items-center justify-content-between py-3 px-4 bg-light-gray-100 rounded hover-bg-light-primary">
                  {/* Lado izquierdo: Icono + Nombre */}
                  <div className="d-flex align-items-center">
                    <div className="symbol symbol-35px me-3">
                      <div className="symbol-label bg-light-primary">
                        <i className="bi bi-folder fs-4 text-primary"></i>
                      </div>
                    </div>
                    <div>
                      <h3 className="fs-5 fw-bold text-gray-900 mb-0">
                        {categoria.nombre}
                      </h3>
                    </div>
                  </div>

                  <div className='d-flex gap-2'>
                  <button
                      className="btn btn-light-primary btn-sm"
                      onClick={() => handleAñadirDocumento(categoria.id)}
                    >
                      <i className="bi bi-file-arrow-up fs-6 me-2"></i>
                      Añadir documento
                    </button>
                    <button
                      className="btn btn-light-primary btn-sm"
                      onClick={() => handleVerDocumentos(categoria)}
                    >
                      <i className="bi bi-eye fs-6 me-2"></i>
                      Ver Documentos
                    </button>
                  </div>
                </div>

                {/* Separador entre elementos */}
                {index < categorias.length - 1 && (
                  <div className="separator separator-dashed my-4"></div>
                )}
              </div>
            ))}
          </div>

          {/* Mensaje cuando no hay categorías */}
          {categorias.length === 0 && (
            <div className="text-center py-10">
              <i className="bi bi-folder-x fs-1 text-muted mb-4"></i>
              <h3 className="fs-1 text-gray-800 fw-bold mb-4">No hay categorías disponibles</h3>
              <p className="text-gray-500 fs-6">
                No se encontraron categorías de documentos para mostrar.
              </p>
              <div className="d-flex gap-3 justify-content-center">
                <button className="btn btn-primary" onClick={() => setShowCrearCategoriaModal(true)}>
                  <i className="bi bi-folder-plus fs-6 me-2"></i>
                  Crear Nueva Categoría
                </button>
                <button className="btn btn-light" onClick={loadCategorias}>
                  <i className="bi bi-arrow-clockwise fs-6 me-2"></i>
                  Actualizar
                </button>
              </div>
            </div>
          )}
        </KTCardBody>
      </KTCard>

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
