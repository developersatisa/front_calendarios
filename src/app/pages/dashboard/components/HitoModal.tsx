import {FC, useEffect, useState} from 'react'
import {Modal} from 'react-bootstrap'
import {KTSVG} from '../../../../_metronic/helpers'
import {Hito} from '../../../api/hitos'

interface Props {
  show: boolean
  onHide: () => void
  onSave: (hito: Omit<Hito, 'id'>) => void
  hito: Hito | null
}

const HitoModal: FC<Props> = ({show, onHide, onSave, hito}) => {
  const initialFormState = {
    nombre: '',
    descripcion: null,
    frecuencia: 1,
    temporalidad: 'mes',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: null,
    obligatorio: 0
  }

  const [formData, setFormData] = useState<Omit<Hito, 'id'>>(initialFormState)

  useEffect(() => {
    if (show) {
      if (hito) {
        setFormData({
          nombre: hito.nombre,
          descripcion: hito.descripcion,
          frecuencia: hito.frecuencia,
          temporalidad: hito.temporalidad,
          fecha_inicio: hito.fecha_inicio,
          fecha_fin: hito.fecha_fin,
          obligatorio: hito.obligatorio
        })
      } else {
        setFormData(initialFormState)
      }
    }
  }, [show, hito])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
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
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              required
              maxLength={255}
            />
          </div>

          <div className='row mb-7'>
            <div className='col-6'>
              <label className='required fw-bold fs-6 mb-2'>Frecuencia</label>
              <input
                type='number'
                className='form-control form-control-solid'
                value={formData.frecuencia}
                onChange={(e) => setFormData({...formData, frecuencia: parseInt(e.target.value) || 1})}
                min={1}
                required
              />
            </div>
            <div className='col-6'>
              <label className='required fw-bold fs-6 mb-2'>Temporalidad</label>
              <select
                className='form-select form-select-solid'
                value={formData.temporalidad}
                onChange={(e) => setFormData({...formData, temporalidad: e.target.value})}
                required
              >
                <option value='dia'>Día</option>
                <option value='semana'>Semana</option>
                <option value='mes'>Mes</option>
                <option value='año'>Año</option>
              </select>
            </div>
          </div>

          <div className='row mb-7'>
            <div className='col-6'>
              <label className='required fw-bold fs-6 mb-2'>Fecha Inicio</label>
              <input
                type='date'
                className='form-control form-control-solid'
                value={formData.fecha_inicio}
                onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                required
              />
            </div>
            <div className='col-6'>
              <label className='required fw-bold fs-6 mb-2'>Fecha Fin</label>
              <input
                type='date'
                className='form-control form-control-solid'
                value={formData.fecha_fin || ''}
                onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                required
              />
            </div>
          </div>

          <div className='fv-row mb-7'>
            <label className='fw-bold fs-6 mb-2'>Descripción</label>
            <textarea
              className='form-control form-control-solid'
              rows={3}
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value || null})}
              maxLength={255}
            />
          </div>

          <div className='fv-row'>
            <div className='form-check form-switch'>
              <input
                className='form-check-input'
                type='checkbox'
                checked={formData.obligatorio === 1}
                onChange={(e) => setFormData({...formData, obligatorio: e.target.checked ? 1 : 0})}
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
