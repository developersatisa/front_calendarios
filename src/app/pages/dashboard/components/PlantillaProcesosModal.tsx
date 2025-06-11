import {FC, useState, useEffect} from 'react'
import {Modal} from 'react-bootstrap'
import {KTSVG} from '../../../../_metronic/helpers'
import {PlantillaProcesos} from '../../../api/plantillaProcesos'
import {Plantilla} from '../../../api/plantillas'
import {Proceso} from '../../../api/procesos'
import Select from 'react-select'
import SharedPagination from '../../../components/pagination/SharedPagination'
import {deletePlantillaProcesos} from '../../../api/plantillaProcesos'

interface Props {
  show: boolean
  onHide: () => void
  onSave: (plantillaProceso: Omit<PlantillaProcesos, 'id'>[]) => void
  plantillas: Plantilla[]
  procesos?: Proceso[]
  selectedPlantillaId?: number
  procesosActuales?: PlantillaProcesos[]
}

const PlantillaProcesosModal: FC<Props> = ({
  show,
  onHide,
  onSave,
  plantillas,
  procesos = [], // Aseguramos valor por defecto
  selectedPlantillaId = 0,
  procesosActuales = []
}) => {
  const [selectedPlantilla, setSelectedPlantilla] = useState<number>(0)
  const [selectedProcesos, setSelectedProcesos] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5 // Cambiado de 10 a 5

  useEffect(() => {
    if (show) {
      if (selectedPlantillaId) {
        setSelectedPlantilla(selectedPlantillaId)
        // Obtener los procesos actuales de la plantilla
        const procesosDePlantilla = procesosActuales
          .filter(p => p.plantilla_id === selectedPlantillaId)
          .map(p => p.proceso_id)
        setSelectedProcesos(procesosDePlantilla)
      } else {
        setSelectedPlantilla(0)
        setSelectedProcesos([])
      }
    } else {
      // Limpiar estados cuando se cierra el modal
      setSearchTerm('')
      setCurrentPage(1)
    }
  }, [selectedPlantillaId, procesosActuales, show])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPlantilla && selectedProcesos.length > 0) {
      try {
        // Primero eliminar todos los procesos actuales de la plantilla
        const procesosABorrar = procesosActuales.filter(p => p.plantilla_id === selectedPlantilla)
        await Promise.all(procesosABorrar.map(p => deletePlantillaProcesos(p.id)))

        // Luego crear las nuevas relaciones
        const newRelations = selectedProcesos.map(procesoId => ({
          plantilla_id: selectedPlantilla,
          proceso_id: procesoId
        }))
        onSave(newRelations)
      } catch (error) {
        console.error('Error al actualizar procesos:', error)
      }
    }
  }

  // Filtrar y paginar procesos
  const filteredProcesos = procesos.filter(proceso =>
    proceso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proceso.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentProcesos = filteredProcesos.slice(indexOfFirstItem, indexOfLastItem)
  const totalItems = filteredProcesos.length

  return (
    <Modal show={show} onHide={onHide} size='lg'>
      <Modal.Header closeButton>
        <Modal.Title>Asignar Procesos a Plantilla</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='mb-5'>
          <div className='d-flex align-items-center position-relative my-1'>
            <KTSVG
              path='/media/icons/duotune/general/gen021.svg'
              className='svg-icon-1 position-absolute ms-6'
            />
            <input
              type='text'
              className='form-control form-control-solid w-250px ps-14'
              placeholder='Buscar proceso...'
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1) // Reset a primera página al buscar
              }}
            />
          </div>
        </div>

        <div className='table-responsive'>
          <table className='table align-middle table-row-dashed fs-6 gy-5'>
            <thead>
              <tr className='text-start text-muted fw-bold fs-7 text-uppercase gs-0'>
                <th style={{width: '50px'}}>
                  <div className='form-check form-check-sm form-check-custom form-check-solid'>
                    <input
                      className='form-check-input'
                      type='checkbox'
                      checked={currentProcesos.length > 0 && currentProcesos.every(p => selectedProcesos.includes(p.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newSelected = [...new Set([...selectedProcesos, ...currentProcesos.map(p => p.id)])]
                          setSelectedProcesos(newSelected)
                        } else {
                          const currentIds = new Set(currentProcesos.map(p => p.id))
                          setSelectedProcesos(selectedProcesos.filter(id => !currentIds.has(id)))
                        }
                      }}
                    />
                  </div>
                </th>
                <th>Proceso</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {currentProcesos.map((proceso) => (
                <tr key={proceso.id}>
                  <td>
                    <div className='form-check form-check-sm form-check-custom form-check-solid'>
                      <input
                        className='form-check-input'
                        type='checkbox'
                        checked={selectedProcesos.includes(proceso.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProcesos([...selectedProcesos, proceso.id])
                          } else {
                            setSelectedProcesos(selectedProcesos.filter(id => id !== proceso.id))
                          }
                        }}
                      />
                    </div>
                  </td>
                  <td>{proceso.nombre}</td>
                  <td>{proceso.descripcion || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SharedPagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </Modal.Body>
      <Modal.Footer>
        <button type='button' className='btn btn-light' onClick={onHide}>
          Cancelar
        </button>
        <button
          type='button'
          className='btn btn-primary'
          onClick={handleSubmit}
          disabled={!selectedPlantilla || selectedProcesos.length === 0}
        >
          {selectedPlantillaId ? 'Actualizar' : 'Guardar'}
        </button>
      </Modal.Footer>
    </Modal>
  )
}

export default PlantillaProcesosModal
