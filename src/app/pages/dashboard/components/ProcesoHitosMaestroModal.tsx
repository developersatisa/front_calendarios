import {FC, useEffect, useState} from 'react'
import {Modal} from 'react-bootstrap'
import {KTSVG} from '../../../../_metronic/helpers'
import {ProcesoHitos, deleteProcesoHitosMaestro} from '../../../api/procesoHitosMaestro'
import {Proceso} from '../../../api/procesos'
import {Hito} from '../../../api/hitos'
import SharedPagination from '../../../components/pagination/SharedPagination'

interface Props {
  show: boolean
  onHide: () => void
  onSave: (procesoHito: Omit<ProcesoHitos, 'id'>[]) => void
  procesos: Proceso[]
  hitos: Hito[]
  hitoMaestro: ProcesoHitos | null
  hitosActuales?: ProcesoHitos[] // Añadimos esta prop para recibir los hitos actuales
  selectedProcesoId?: number
}

const ProcesoHitosMaestroModal: FC<Props> = ({
  show,
  onHide,
  onSave,
  procesos,
  hitos,
  hitoMaestro,
  hitosActuales = [],
  selectedProcesoId = 0
}) => {
  const [selectedHitos, setSelectedHitos] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5 // Cambiado de 10 a 5

  useEffect(() => {
    if (show) {
      if (selectedProcesoId) {
        const hitosDelProceso = hitosActuales
          .filter(h => h.id_proceso === selectedProcesoId)
          .map(h => h.id_hito)
        setSelectedHitos(hitosDelProceso)
      } else {
        setSelectedHitos([])
      }
    } else {
      setSearchTerm('')
      setCurrentPage(1)
    }
  }, [show, selectedProcesoId, hitosActuales])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedProcesoId && selectedHitos.length > 0) {
      try {
        // Primero eliminar todos los hitos actuales del proceso
        const hitosABorrar = hitosActuales.filter(h => h.id_proceso === selectedProcesoId)
        await Promise.all(hitosABorrar.map(h => deleteProcesoHitosMaestro(h.id)))

        // Luego crear las nuevas relaciones
        const newRelations = selectedHitos.map(hitoId => ({
          id_proceso: selectedProcesoId,
          id_hito: hitoId
        }))
        await onSave(newRelations)
      } catch (error) {
        console.error('Error al actualizar hitos:', error)
      }
    }
  }

  // Filtrar y paginar hitos
  const filteredHitos = hitos.filter(hito =>
    hito.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (hito.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentHitos = filteredHitos.slice(indexOfFirstItem, indexOfLastItem)
  const totalItems = filteredHitos.length

  return (
    <Modal show={show} onHide={onHide} size='lg'>
      <Modal.Header closeButton>
        <Modal.Title>Asignar Hitos a Proceso</Modal.Title>
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
              placeholder='Buscar hito...'
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
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
                      checked={currentHitos.length > 0 && currentHitos.every(h => selectedHitos.includes(h.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newSelected = [...new Set([...selectedHitos, ...currentHitos.map(h => h.id)])]
                          setSelectedHitos(newSelected)
                        } else {
                          const currentIds = new Set(currentHitos.map(h => h.id))
                          setSelectedHitos(selectedHitos.filter(id => !currentIds.has(id)))
                        }
                      }}
                    />
                  </div>
                </th>
                <th>Hito</th>
                <th>Descripción</th>
                <th>Frecuencia</th>
                <th>Temporalidad</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
              </tr>
            </thead>
            <tbody>
              {currentHitos.map((hito) => (
                <tr key={hito.id}>
                  <td>
                    <div className='form-check form-check-sm form-check-custom form-check-solid'>
                      <input
                        className='form-check-input'
                        type='checkbox'
                        checked={selectedHitos.includes(hito.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedHitos([...selectedHitos, hito.id])
                          } else {
                            setSelectedHitos(selectedHitos.filter(id => id !== hito.id))
                          }
                        }}
                      />
                    </div>
                  </td>
                  <td>{hito.nombre}</td>
                  <td>{hito.descripcion || '-'}</td>
                  <td>{hito.frecuencia}</td>
                  <td className='text-capitalize'>{hito.temporalidad}</td>
                  <td>{new Date(hito.fecha_inicio).toLocaleDateString()}</td>
                  <td>{hito.fecha_fin ? new Date(hito.fecha_fin).toLocaleDateString() : '-'}</td>
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
          disabled={!selectedProcesoId || selectedHitos.length === 0}
        >
          {hitoMaestro ? 'Actualizar' : 'Guardar'}
        </button>
      </Modal.Footer>
    </Modal>
  )
}

export default ProcesoHitosMaestroModal
