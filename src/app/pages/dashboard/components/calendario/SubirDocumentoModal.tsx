import { FC, useRef, useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { finalizarClienteProcesoHito } from '../../../../api/clienteProcesoHitos'
import { subirDocumento } from '../../../../api/documentos'

interface Props {
  show: boolean
  onHide: () => void
  idClienteProcesoHito: number
  nombreDocumento: string
  onUploadSuccess: () => void
  estado?: string
}

const SubirDocumentoModal: FC<Props> = ({ show, onHide, idClienteProcesoHito, nombreDocumento, onUploadSuccess, estado }) => {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isFinalized = estado === 'Finalizado'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    } else {
      setFile(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    try {
      await subirDocumento(idClienteProcesoHito, file.name, file)
      await finalizarClienteProcesoHito(idClienteProcesoHito)
      onUploadSuccess()
      onHide()
    } catch (err) {
      console.error('Error al subir el documento:', err)
      alert('Error al subir el documento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Cumplimintar hito - {nombreDocumento}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isFinalized ? (
          <div className="alert alert-info">
            <h6 className="alert-heading">Proceso Finalizado</h6>
            <p className="mb-0">Este hito ya está finalizado. No es posible subir documentos adicionales.</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formFile">
              <Form.Label>Selecciona un archivo para {nombreDocumento}</Form.Label>
              <Form.Control type="file" onChange={handleFileChange} ref={fileInputRef} required />
            </Form.Group>
            <Button variant="primary" type="submit" className="mt-3" disabled={loading || !file}>
              {loading ? 'Subiendo...' : 'Subir Documento'}
            </Button>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default SubirDocumentoModal
