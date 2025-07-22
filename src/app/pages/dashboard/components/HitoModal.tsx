import { FC, useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { KTSVG } from '../../../../_metronic/helpers'
import { Hito } from '../../../api/hitos'

interface Props {
  show: boolean
  onHide: () => void
  onSave: (hito: Omit<Hito, 'id'>) => void
  hito: Hito | null
}

const HitoModal: FC<Props> = ({ show, onHide, onSave, hito }) => {
  const initialFormState = {
    nombre: '',
    descripcion: null,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: null,
    hora_limite: '00:00',
    obligatorio: 0,
    tipo: 'Atisa' // Valor por defecto válido ya que es requerido
  }

  const [formData, setFormData] = useState<Omit<Hito, 'id'>>(initialFormState)

  useEffect(() => {
    if (show && hito) {
      setFormData({
        nombre: hito.nombre,
        descripcion: hito.descripcion,
        fecha_inicio: hito.fecha_inicio,
        fecha_fin: hito.fecha_fin,
        hora_limite: hito.hora_limite,
        obligatorio: hito.obligatorio,
        tipo: hito.tipo
      })
    } else {
      setFormData(initialFormState)
    }
  }, [show, hito])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Preparar los datos asegurando tipos correctos
    const dataToSave = {
      ...formData,
      descripcion: formData.descripcion?.trim() || null,
      fecha_fin: formData.fecha_fin || null,
      hora_limite: formData.hora_limite || '00:00'
    }

    onSave(dataToSave)
    setFormData(initialFormState)
    onHide()
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      dialogClassName='modal-dialog modal-dialog-centered mw-650px'
    >
      <form onSubmit={handleSubmit}>
        <Modal.Header>
          <Modal.Title>{hito ? 'Editar' : 'Nuevo'} Hito</Modal.Title>
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
              placeholder='Nombre del hito'
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              maxLength={255}
            />
          </div>

          <div className='fv-row mb-7'>
            <label className='required fw-bold fs-6 mb-2'>Tipo</label>
            <select
              className='form-select form-select-solid'
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              required
            >
              <option value='Atisa'>Atisa</option>
              <option value='Cliente'>Cliente</option>
            </select>
          </div>

          <div className='row mb-7'>
            <div className='col-6'>
              <label className='required fw-bold fs-6 mb-2'>Fecha Inicio</label>
              <input
                type='date'
                className='form-control form-control-solid'
                value={formData.fecha_inicio}
                onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                required
              />
            </div>
            <div className='col-6'>
              <label className='fw-bold fs-6 mb-2'>Fecha Límite</label>
              <input
                type='date'
                className='form-control form-control-solid'
                value={formData.fecha_fin || ''}
                onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value || null })}
              />
            </div>
          </div>

          <div className='fv-row mb-7'>
            <label className='fw-bold fs-6 mb-2'>Hora límite</label>
            <input
              type='time'
              className='form-control form-control-solid'
              value={formData.hora_limite || '00:00'}
              onChange={(e) => setFormData({ ...formData, hora_limite: e.target.value || '00:00' })}
            />
          </div>

          <div className='fv-row mb-7'>
            <label className='fw-bold fs-6 mb-2'>Descripción</label>
            <textarea
              className='form-control form-control-solid'
              rows={3}
              placeholder='Descripción del hito (opcional)'
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value || null })}
              maxLength={255}
            />
          </div>

          <div className='fv-row mb-7'>
            <div className='form-check form-switch'>
              <input
                className='form-check-input'
                type='checkbox'
                checked={formData.obligatorio === 1}
                onChange={(e) => setFormData({ ...formData, obligatorio: e.target.checked ? 1 : 0 })}
                id='obligatorio'
              />
              <label className='form-check-label' htmlFor='obligatorio'>
                Obligatorio
              </label>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button type='button' className='btn btn-light' onClick={onHide}>
            Cancelar
          </button>
          <button type='submit' className='btn btn-primary'>
            {hito ? 'Actualizar' : 'Crear'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default HitoModal
