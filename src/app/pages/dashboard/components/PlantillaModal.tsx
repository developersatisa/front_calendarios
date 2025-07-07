import {FC, useEffect, useState} from 'react'
import {Modal} from 'react-bootstrap'
import {KTSVG} from '../../../../_metronic/helpers'
import {Plantilla} from '../../../api/plantillas'

interface Props {
  show: boolean
  onHide: () => void
  onSave: (plantilla: Omit<Plantilla, 'id'>) => void
  plantilla: Plantilla | null
}

const PlantillaModal: FC<Props> = ({show, onHide, onSave, plantilla}) => {
  const [formData, setFormData] = useState<Omit<Plantilla, 'id'>>({
    nombre: '',
    descripcion: null
  })

  useEffect(() => {
    if (plantilla) {
      setFormData({
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion
      })
    } else {
      setFormData({
        nombre: '',
        descripcion: null
      })
    }
  }, [plantilla])

  return (
    <Modal
      show={show}
      onHide={onHide}
      dialogClassName='modal-dialog modal-dialog-centered mw-650px'
    >
      <form
        onSubmit={e => {
          e.preventDefault()
          onSave({
            ...formData,
            descripcion: formData.descripcion ?? '' // Siempre enviar string
          })
        }}
      >
        <Modal.Header>
          <Modal.Title>{plantilla ? 'Editar' : 'Nueva'} Plantilla</Modal.Title>
          <div className='btn btn-icon btn-sm btn-active-icon-primary' onClick={onHide}>
            <KTSVG className='svg-icon-1' path='/media/icons/duotune/arrows/arr061.svg' />
          </div>
        </Modal.Header>

        <Modal.Body>
          <div className='fv-row mb-7'>
            <label className='required fw-bold fs-6 mb-2'>Nombre</label>
            <input
              type='text'
              className='form-control form-control-solid'
              placeholder='Nombre de la plantilla'
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              required
              maxLength={255}
            />
          </div>

          <div className='fv-row mb-7'>
            <label className='fw-bold fs-6 mb-2'>Descripción</label>
            <textarea
              className='form-control form-control-solid'
              placeholder='Descripción de la plantilla'
              rows={3}
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value || null})}
              maxLength={255}
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button type='button' className='btn btn-light' onClick={onHide}>
            Cancelar
          </button>
          <button type='submit' className='btn btn-primary'>
            {plantilla ? 'Actualizar' : 'Crear'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default PlantillaModal
