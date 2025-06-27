import {FC, useEffect, useState} from 'react'
import {Modal} from 'react-bootstrap'
import {KTSVG} from '../../../../_metronic/helpers'
import {ClienteProcesoHito} from '../../../api/clienteProcesoHitos'
import {ClienteProceso} from '../../../api/clienteProcesos'
import {ProcesoHitos} from '../../../api/procesoHitosMaestro'
import {Hito} from '../../../api/hitos'

interface Props {
  show: boolean
  onHide: () => void
  onSave: (clienteProcesoHito: Omit<ClienteProcesoHito, 'id'>) => void
  clienteProcesoHito: ClienteProcesoHito | null
  clienteProcesos: ClienteProceso[]
  procesoHitos: ProcesoHitos[]
  hitos: Hito[] // Añadimos esta prop para tener acceso a los nombres de los hitos
}

const ClienteProcesoHitosModal: FC<Props> = ({
  show,
  onHide,
  onSave,
  clienteProcesoHito,
  clienteProcesos,
  procesoHitos,
  hitos
}) => {
  const initialFormState = {
    cliente_proceso_id: 0,
    hito_id: 0,
    estado: 'pendiente',
    fecha_estado: new Date().toISOString(),
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: null
  }

  const [formData, setFormData] = useState<Omit<ClienteProcesoHito, 'id'>>(initialFormState)
  const [hitosDisponibles, setHitosDisponibles] = useState<ProcesoHitos[]>([])

  // Resetear el formulario cuando se cierra el modal o cambia el hito editando
  useEffect(() => {
    if (!show) {
      setFormData(initialFormState)
    } else if (clienteProcesoHito) {
      setFormData({
        cliente_proceso_id: clienteProcesoHito.cliente_proceso_id,
        hito_id: clienteProcesoHito.hito_id,
        estado: clienteProcesoHito.estado,
        fecha_estado: clienteProcesoHito.fecha_estado || new Date().toISOString(),
        fecha_inicio: clienteProcesoHito.fecha_inicio,
        fecha_fin: clienteProcesoHito.fecha_fin
      })

      // Cargar hitos del proceso al editar
      const clienteProceso = clienteProcesos.find(cp => cp.id === clienteProcesoHito.cliente_proceso_id)
      if (clienteProceso) {
        const hitosDelProceso = procesoHitos.filter(ph => ph.id_proceso === clienteProceso.id_proceso)
        setHitosDisponibles(hitosDelProceso)
      }
    } else {
      setFormData(initialFormState)
    }
  }, [show, clienteProcesoHito, clienteProcesos, procesoHitos])

  // Manejar cambio de cliente-proceso
  const handleClienteProcesoChange = (clienteProcesoId: number) => {
    const clienteProceso = clienteProcesos.find(cp => cp.id === clienteProcesoId)
    if (clienteProceso) {
      const hitosDelProceso = procesoHitos.filter(ph => ph.id_proceso === clienteProceso.id_proceso)
      setHitosDisponibles(hitosDelProceso)
      setFormData({
        ...formData,
        cliente_proceso_id: clienteProcesoId,
        hito_id: 0 // Resetear hito seleccionado
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    setFormData(initialFormState)
    onHide()
  }

  // Modificar el select de hitos para mostrar todos los hitos disponibles
  return (
    <Modal
      show={show}
      onHide={onHide}
      dialogClassName='modal-dialog modal-dialog-centered mw-650px'
    >
      <form onSubmit={handleSubmit}>
        <Modal.Header>
          <Modal.Title>{clienteProcesoHito ? 'Editar' : 'Nuevo'} Hito</Modal.Title>
          <div className='btn btn-icon btn-sm btn-active-icon-primary' onClick={onHide}>
            <KTSVG className='svg-icon-1' path='/media/icons/duotune/arrows/arr061.svg' />
          </div>
        </Modal.Header>

        <Modal.Body>
          <div className='fv-row mb-7'>
            <label className='required fw-bold fs-6 mb-2'>Cliente Proceso</label>
            <select
              className='form-select form-select-solid'
              value={formData.cliente_proceso_id}
              onChange={(e) => handleClienteProcesoChange(Number(e.target.value))}
              required
            >
              <option value=''>Seleccione un cliente proceso</option>
              {clienteProcesos.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  {cp.idcliente} - {cp.id_proceso}
                </option>
              ))}
            </select>
          </div>

          <div className='fv-row mb-7'>
            <label className='required fw-bold fs-6 mb-2'>Hito</label>
            <select
              className='form-select form-select-solid'
              value={formData.hito_id}
              onChange={(e) => setFormData({...formData, hito_id: Number(e.target.value)})}
              required
              disabled={!formData.cliente_proceso_id}
            >
              <option value='0'>Seleccione un hito</option>
              {hitosDisponibles.map((ph) => {
                const hito = hitos.find(h => h.id === ph.id_hito)
                return (
                  <option key={ph.id} value={ph.id}>
                    {hito ? `${hito.nombre} ${hito.obligatorio ? '(Obligatorio)' : ''}` : `Hito ${ph.id_hito}`}
                  </option>
                )
              })}
            </select>
            {!formData.cliente_proceso_id && (
              <small className='text-muted d-block mt-2'>
                Seleccione primero un cliente proceso para ver los hitos disponibles
              </small>
            )}
          </div>

          <div className='fv-row mb-7'>
            <label className='required fw-bold fs-6 mb-2'>Estado</label>
            <select
              className='form-select form-select-solid'
              value={formData.estado}
              onChange={(e) => setFormData({...formData, estado: e.target.value})}
              required
            >
              <option value='pendiente'>Pendiente</option>
              <option value='en_proceso'>En Proceso</option>
              <option value='completado'>Completado</option>
              <option value='cancelado'>Cancelado</option>
            </select>
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
              <label className='fw-bold fs-6 mb-2'>Fecha Fin</label>
              <input
                type='date'
                className='form-control form-control-solid'
                value={formData.fecha_fin || ''}
                onChange={(e) => setFormData({...formData, fecha_fin: e.target.value || null})}
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button type='button' className='btn btn-light' onClick={onHide}>
            Cancelar
          </button>
          <button type='submit' className='btn btn-primary'>
            {clienteProcesoHito ? 'Actualizar' : 'Crear'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default ClienteProcesoHitosModal
