import {FC} from 'react'
import {Modal} from 'react-bootstrap'
import {KTSVG} from '../../../../../_metronic/helpers'
import {Proceso} from '../../../../api/procesos'
import {Hito} from '../../../../api/hitos'

interface Props {
  show: boolean
  onHide: () => void
  proceso: Proceso | undefined
  hitos: Hito[]
}

const HitosModal: FC<Props> = ({show, onHide, proceso, hitos}) => {
  if (!proceso) return null

  return (
    <Modal
      show={show}
      onHide={onHide}
      dialogClassName='modal-dialog modal-dialog-centered mw-650px'
    >
      <Modal.Header>
        <Modal.Title>Hitos del Proceso: {proceso.nombre}</Modal.Title>
        <div className='btn btn-icon btn-sm btn-active-icon-primary' onClick={onHide}>
          <KTSVG className='svg-icon-1' path='/media/icons/duotune/arrows/arr061.svg' />
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className='d-flex flex-column gap-5'>
          {hitos.map(hito => (
            <div key={hito.id} className='d-flex align-items-start'>
              <span className={`bullet bullet-vertical h-40px bg-${hito.obligatorio ? 'success' : 'primary'}`}></span>
              <div className='ms-5'>
                <span className='fs-5 fw-bold text-gray-900 d-block'>{hito.nombre}</span>
                {hito.descripcion && (
                  <span className='text-muted fw-semibold d-block'>{hito.descripcion}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default HitosModal
