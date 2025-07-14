import {FC, useEffect, useState} from 'react'
import {Modal} from 'react-bootstrap'
import {KTSVG} from '../../../../_metronic/helpers'
import {Proceso} from '../../../api/procesos'

interface Props {
  show: boolean
  onHide: () => void
  onSave: (proceso: Omit<Proceso, 'id'>) => void
  proceso: Proceso | null
}

const ProcesoModal: FC<Props> = ({show, onHide, onSave, proceso}) => {
  const [formData, setFormData] = useState<Omit<Proceso, 'id'>>({
    nombre: '',
    descripcion: null,
    frecuencia: 1,
    temporalidad: 'mes',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: null,
  })

  useEffect(() => {
    if (proceso) {
      setFormData({
        nombre: proceso.nombre,
        descripcion: proceso.descripcion,
        frecuencia: proceso.frecuencia,
        temporalidad: proceso.temporalidad,
        fecha_inicio: proceso.fecha_inicio,
        fecha_fin: proceso.fecha_fin,
      })
    } else {
      setFormData({
        nombre: '',
        descripcion: null,
        frecuencia: 1,
        temporalidad: 'mes',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: null,
      })
    }
  }, [proceso, show])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      aria-labelledby='kt_modal_1'
      dialogClassName='modal-dialog modal-dialog-centered mw-650px'
    >
      <form onSubmit={handleSubmit} id='kt_modal_add_proceso_form' className='form'>
        <Modal.Header className='modal-header'>
          <Modal.Title className='fw-bolder'>{proceso ? 'Editar' : 'Nuevo'} Proceso</Modal.Title>
          <div className='btn btn-icon btn-sm btn-active-icon-primary' onClick={onHide}>
            <KTSVG className='svg-icon-1' path='/media/icons/duotune/arrows/arr061.svg' />
          </div>
        </Modal.Header>

        <Modal.Body className='modal-body scroll-y mx-5 mx-xl-15 my-7'>
          <div className='d-flex flex-column scroll-y me-n7 pe-7'>
            <div className='fv-row mb-7'>
              <label className='required fw-bold fs-6 mb-2'>Nombre</label>
              <input
                type='text'
                className='form-control form-control-solid mb-3 mb-lg-0'
                placeholder='Nombre del proceso'
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
                maxLength={150}
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
                  <option value='dia'>Diaria</option>
                  <option value='semana'>Semanal</option>
                  <option value='quincena'>Quincenal</option>
                  <option value='mes'>Mensual</option>
                  <option value='trimestre'>Trimestral</option>
                  <option value='año'>Anual</option>
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
                <label className='fw-bold fs-6 mb-2'>Fecha Cumplimiento</label>
                <input
                  type='date'
                  className='form-control form-control-solid'
                  value={formData.fecha_fin || ''}
                  onChange={(e) => setFormData({...formData, fecha_fin: e.target.value || null})}
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
          </div>
        </Modal.Body>

        <Modal.Footer className='modal-footer'>
          <button type='button' className='btn btn-light' onClick={onHide}>
            Cancelar
          </button>
          <button type='submit' className='btn btn-primary'>
            <span className='indicator-label'>{proceso ? 'Actualizar' : 'Guardar'}</span>
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default ProcesoModal
