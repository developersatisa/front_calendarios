import { FC, useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { KTSVG } from '../../../../_metronic/helpers'
import { Metadato } from '../../../api/metadatos'
import { MetadatoArea, deleteMetadatoAreaByMetadato } from '../../../api/metadatosArea'

interface Props {
  show: boolean
  onHide: () => void
  onSave: (metadato: Omit<Metadato, 'id'>) => void
  metadato: Metadato | null
  areasActuales?: MetadatoArea[]
}

const MetadatoModal: FC<Props> = ({ show, onHide, onSave, metadato, areasActuales = [] }) => {
  const [formData, setFormData] = useState<Omit<Metadato, 'id'>>({
    nombre: '',
    descripcion: '',
    tipo_generacion: 'manual',
    global_: false,
    activo: true
  })

  useEffect(() => {
    if (metadato) {
      setFormData({
        nombre: metadato.nombre,
        descripcion: metadato.descripcion || '',
        tipo_generacion: metadato.tipo_generacion,
        global_: metadato.global_,
        activo: metadato.activo
      })
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        tipo_generacion: 'manual',
        global_: false,
        activo: true
      })
    }
  }, [metadato])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Si se está marcando como global y existe el metadato, eliminar relaciones
    // if (formData.global_ && metadato?.id && !metadato?.global_) {
    //   await deleteMetadatoAreaByMetadato(metadato.id)
    // }

    onSave({
      ...formData,
      descripcion: formData.descripcion || undefined
    })
  }

  const handleGlobalChange = (checked: boolean) => {
    setFormData({ ...formData, global_: checked })
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      dialogClassName='modal-dialog modal-dialog-centered mw-650px'
    >
      <form onSubmit={handleSubmit}>
        <Modal.Header>
          <Modal.Title>{metadato ? 'Editar' : 'Nuevo'} Metadato</Modal.Title>
          <div className='btn btn-icon btn-sm btn-active-icon-primary' onClick={onHide}>
            <KTSVG className='svg-icon-1' path='/media/icons/duotune/arrows/arr061.svg' />
          </div>
        </Modal.Header>

        <Modal.Body>
          {metadato && formData.tipo_generacion === 'automatico' && (
            <div className='alert alert-info mb-7'>
              <div className='alert-text'>
                <strong>Metadato Automático:</strong> Solo se pueden editar la descripción, global y activo.
              </div>
            </div>
          )}

          <div className='fv-row mb-7'>
            <label className='required fw-bold fs-6 mb-2'>Nombre</label>
            <input
              type='text'
              className={`form-control form-control-solid ${formData.tipo_generacion === 'automatico' ? 'bg-light' : ''}`}
              placeholder='Nombre del metadato'
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              maxLength={255}
              disabled={formData.tipo_generacion === 'automatico'}
            />
          </div>

          <div className='fv-row mb-7'>
            <label className='fw-bold fs-6 mb-2'>Descripción</label>
            <textarea
              className='form-control form-control-solid'
              placeholder='Descripción del metadato'
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              maxLength={500}
            />
          </div>

          <div className='fv-row mb-7'>
            <label className='fw-bold fs-6 mb-2'>Tipo de Generación</label>
            <input
              type='text'
              className='form-control form-control-solid bg-light'
              value={formData.tipo_generacion}
              readOnly
            />
          </div>

          <div className='fv-row mb-7'>
            <div className='form-check form-switch'>
              <input
                className='form-check-input'
                type='checkbox'
                checked={formData.global_}
                onChange={(e) => handleGlobalChange(e.target.checked)}
                id='global'
              />
              <label className='form-check-label' htmlFor='global'>
                Global
              </label>
            </div>
          </div>

          <div className='fv-row'>
            <div className='form-check form-switch'>
              <input
                className='form-check-input'
                type='checkbox'
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                id='activo'
              />
              <label className='form-check-label' htmlFor='activo'>
                Activo
              </label>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button type='button' className='btn btn-light' onClick={onHide}>
            Cancelar
          </button>
          <button type='submit' className='btn btn-primary'>
            {metadato ? 'Actualizar' : 'Crear'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default MetadatoModal
