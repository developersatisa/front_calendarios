import React, {FC, useState, useEffect} from 'react'
import {Modal} from 'react-bootstrap'
import {Cliente} from '../../../api/clientes'
import {Plantilla} from '../../../api/plantillas'
import {GenerarCalendarioParams} from '../../../api/clienteProcesos'
import Select from 'react-select'
import {getProcesosByPlantilla} from '../../../api/plantillaProcesos'
import {Proceso} from '../../../api/procesos'
import {KTSVG} from '../../../../_metronic/helpers'

interface Props {
  show: boolean
  onHide: () => void
  onSave: (calendarios: GenerarCalendarioParams[]) => void
  plantillas: Plantilla[]
  selectedCliente: Cliente | null
  procesosList: Proceso[]
}

const ClienteProcesosModal: FC<Props> = ({
  show,
  onHide,
  onSave,
  plantillas,
  selectedCliente,
  procesosList,
}) => {
  const [formData, setFormData] = useState({
    plantillaId: '',
    fechaInicio: '',
  })
  const [procesos, setProcesos] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [showAllMonths, setShowAllMonths] = useState(false)

  const handlePlantillaChange = async (option: any) => {
    setFormData({...formData, plantillaId: option?.value || ''})
    if (option?.value) {
      try {
        setLoading(true)
        const procesosDePlantilla = await getProcesosByPlantilla(option.value)
        setProcesos(procesosDePlantilla.map(p => p.proceso_id))
      } catch (error) {
        console.error('Error al cargar los procesos:', error)
        setProcesos([])
      } finally {
        setLoading(false)
      }
    } else {
      setProcesos([])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCliente || !formData.plantillaId || !formData.fechaInicio || !procesos.length) return

    const calendarios = procesos.map(procesoId => ({
      idcliente: Number(selectedCliente.idcliente),
      id_proceso: procesoId,
      fecha_inicio: formData.fechaInicio,
    }))

    onSave(calendarios)
  }

  const getProcesosInfo = (procesoId: number) => {
    return procesosList.find(p => p.id === procesoId)?.nombre || `Proceso ${procesoId}`
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Generar Calendario</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit}>
          <div className='row mb-3'>
            <div className='col-md-6'>
              <label className='form-label required'>Cliente</label>
              <input
                type='text'
                className='form-control form-control-solid'
                value={selectedCliente?.razsoc || ''}
                readOnly
              />
            </div>
            <div className='col-md-6'>
              <label className='form-label required'>Plantilla</label>
              <Select
                onChange={handlePlantillaChange}
                options={plantillas.map(p => ({
                  value: p.id,
                  label: p.nombre
                }))}
                noOptionsMessage={() => "No hay plantillas disponibles"}
                placeholder="Seleccione una plantilla"
                isLoading={loading}
              />
              {loading && <div className="text-muted">Cargando procesos...</div>}
              {procesos.length > 0 && (
                <div className="mt-3">
                  <h6>Procesos seleccionados: {procesos.length}</h6>
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #dee2e6',
                    borderRadius: '0.475rem'
                  }}>
                    <ul className="list-group list-group-flush">
                      {procesos.map((procesoId) => (
                        <li key={procesoId} className="list-group-item">
                          {getProcesosInfo(procesoId)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='row mb-6'>
            <div className='col-lg-12'>
              <label className='required fw-bold fs-6 mb-2'>Fecha Inicio</label>
              <input
                type='date'
                className='form-control form-control-solid'
                value={formData.fechaInicio}
                onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                required
              />
            </div>
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <button type='button' className='btn btn-light' onClick={onHide}>
          Cancelar
        </button>
        <button
          type='button'
          className='btn btn-primary'
          onClick={handleSubmit}
          disabled={!selectedCliente || !formData.plantillaId || !formData.fechaInicio}
        >
          Generar
        </button>
      </Modal.Footer>
    </Modal>
  )
}

export default ClienteProcesosModal
