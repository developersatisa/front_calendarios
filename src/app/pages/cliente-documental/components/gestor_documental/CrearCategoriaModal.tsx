import React, { FC, useState, useEffect } from 'react'
import { Modal, Button, Form, Alert } from 'react-bootstrap'
import { createDocumentalCategoria, DocumentalCategoriaCreate } from '../../../../api/documentalCategorias'
import { atisaStyles } from '../../../../styles/atisaStyles'

interface Props {
  show: boolean
  onHide: () => void
  clienteId: string
  onSuccess: () => void
}

const CrearCategoriaModal: FC<Props> = ({ show, onHide, clienteId, onSuccess }) => {
  const [formData, setFormData] = useState<DocumentalCategoriaCreate>({
    id_cliente: clienteId,
    nombre: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (show) {
      setFormData({
        id_cliente: clienteId,
        nombre: ''
      })
      setError(null)
    }
  }, [show, clienteId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      setError('El nombre de la categoría es obligatorio')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await createDocumentalCategoria(formData)

      // Limpiar formulario y cerrar modal
      setFormData({
        id_cliente: clienteId,
        nombre: ''
      })

      onSuccess()
      onHide()
    } catch (err) {
      console.error('Error al crear categoría:', err)
      setError('Error al crear la categoría. Por favor, inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      id_cliente: clienteId,
      nombre: ''
    })
    setError(null)
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} centered>
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
          <i className="bi bi-folder-plus me-2" style={{ color: 'white' }}></i>
          Crear Nueva Categoría
        </Modal.Title>
        <div
          className='btn btn-icon btn-sm'
          onClick={handleClose}
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

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-4">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <div className="mb-4">
            <Form.Label className="fw-bold mb-2">
              Nombre de la Categoría <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingresa el nombre de la categoría"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              maxLength={255}
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Máximo 255 caracteres
            </Form.Text>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="light" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !formData.nombre.trim()}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creando...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Crear Categoría
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default CrearCategoriaModal
