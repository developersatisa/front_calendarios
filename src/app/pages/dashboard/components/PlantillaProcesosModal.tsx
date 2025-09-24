import { FC, useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import { KTSVG } from '../../../../_metronic/helpers'
import { PlantillaProcesos } from '../../../api/plantillaProcesos'
import { Plantilla } from '../../../api/plantillas'
import { Proceso } from '../../../api/procesos'
import Select from 'react-select'
import SharedPagination from '../../../components/pagination/SharedPagination'
import { deletePlantillaProcesos } from '../../../api/plantillaProcesos'
import { atisaStyles } from '../../../styles/atisaStyles'

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
    <Modal
      show={show}
      onHide={onHide}
      size='lg'
      style={{
        fontFamily: atisaStyles.fonts.secondary
      }}
    >
      <Modal.Header
        closeButton
        style={{
          backgroundColor: atisaStyles.colors.primary,
          color: 'white',
          border: 'none',
          borderRadius: '12px 12px 0 0'
        }}
      >
        <Modal.Title
          style={{
            fontFamily: atisaStyles.fonts.primary,
            fontWeight: 'bold',
            color: 'white',
            fontSize: '1.5rem'
          }}
        >
          <i className="bi bi-diagram-3 me-2"></i>
          Asignar Procesos a Plantilla
        </Modal.Title>
      </Modal.Header>
      <Modal.Body
        style={{
          backgroundColor: 'white',
          padding: '24px'
        }}
      >
        <div className='d-flex align-items-center position-relative my-1'>
          <i
            className='bi bi-search position-absolute'
            style={{
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: atisaStyles.colors.primary,
              fontSize: '16px',
              zIndex: 10
            }}
          ></i>
          <input
            type='text'
            className='form-control form-control-solid w-250px ps-14'
            placeholder='Buscar proceso...'
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1) // Reset a primera página al buscar
            }}
            style={{
              border: `2px solid ${atisaStyles.colors.light}`,
              borderRadius: '8px',
              fontFamily: atisaStyles.fonts.secondary,
              fontSize: '14px',
              paddingLeft: '48px',
              height: '48px'
            }}
          />
        </div>

        <div
          className='table-responsive'
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
            border: `1px solid ${atisaStyles.colors.light}`,
            overflow: 'hidden'
          }}
        >
          <table
            className='table align-middle table-row-dashed fs-6 gy-5'
            style={{
              fontFamily: atisaStyles.fonts.secondary,
              margin: 0
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: atisaStyles.colors.primary,
                  color: 'white'
                }}
              >
                <th
                  style={{
                    width: '50px',
                    fontFamily: atisaStyles.fonts.primary,
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '16px 12px',
                    border: 'none',
                    color: 'white'
                  }}
                >
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
                      style={{
                        borderColor: 'white',
                        backgroundColor: 'transparent'
                      }}
                    />
                  </div>
                </th>
                <th
                  style={{
                    fontFamily: atisaStyles.fonts.primary,
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '16px 12px',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  Proceso
                </th>
                <th
                  style={{
                    fontFamily: atisaStyles.fonts.primary,
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '16px 12px',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody>
              {currentProcesos.map((proceso, index) => (
                <tr
                  key={proceso.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 80, 92, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <td style={{ padding: '16px 12px' }}>
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
                        style={{
                          borderColor: atisaStyles.colors.primary,
                          backgroundColor: selectedProcesos.includes(proceso.id) ? atisaStyles.colors.secondary : 'transparent'
                        }}
                      />
                    </div>
                  </td>
                  <td
                    style={{
                      fontFamily: atisaStyles.fonts.secondary,
                      color: atisaStyles.colors.primary,
                      fontWeight: '600',
                      padding: '16px 12px'
                    }}
                  >
                    {proceso.nombre}
                  </td>
                  <td
                    style={{
                      fontFamily: atisaStyles.fonts.secondary,
                      color: atisaStyles.colors.dark,
                      padding: '16px 12px'
                    }}
                  >
                    {proceso.descripcion || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '16px 20px',
            borderRadius: '8px',
            marginTop: '20px'
          }}
        >
          <SharedPagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </Modal.Body>
      <Modal.Footer
        style={{
          backgroundColor: '#f8f9fa',
          border: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '20px 24px'
        }}
      >
        <button
          type='button'
          className='btn'
          onClick={onHide}
          style={{
            backgroundColor: 'transparent',
            color: atisaStyles.colors.dark,
            border: `2px solid ${atisaStyles.colors.light}`,
            borderRadius: '8px',
            fontFamily: atisaStyles.fonts.secondary,
            fontWeight: '600',
            padding: '10px 20px',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = atisaStyles.colors.light
            e.currentTarget.style.color = atisaStyles.colors.primary
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = atisaStyles.colors.dark
          }}
        >
          <i className="bi bi-x-circle me-2"></i>
          Cancelar
        </button>
        <button
          type='button'
          className='btn'
          onClick={handleSubmit}
          disabled={!selectedPlantilla || selectedProcesos.length === 0}
          style={{
            backgroundColor: selectedProcesos.length === 0 ? '#6c757d' : atisaStyles.colors.secondary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontFamily: atisaStyles.fonts.secondary,
            fontWeight: '600',
            padding: '10px 20px',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            marginLeft: '12px'
          }}
          onMouseEnter={(e) => {
            if (selectedProcesos.length > 0) {
              e.currentTarget.style.backgroundColor = atisaStyles.colors.accent
              e.currentTarget.style.transform = 'translateY(-2px)'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedProcesos.length > 0) {
              e.currentTarget.style.backgroundColor = atisaStyles.colors.secondary
              e.currentTarget.style.transform = 'translateY(0)'
            }
          }}
        >
          <i className="bi bi-check-circle me-2"></i>
          {selectedPlantillaId ? 'Actualizar' : 'Guardar'}
        </button>
      </Modal.Footer>
    </Modal>
  )
}

export default PlantillaProcesosModal
