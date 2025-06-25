import React, { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KTCard, KTCardBody, KTSVG } from '../../../_metronic/helpers'
import { Cliente, getAllClientes } from '../../api/clientes'
import { getAllPlantillas, Plantilla } from '../../api/plantillas'
import { getPageNumbers } from '../../utils/pagination'
import SharedPagination from '../../components/pagination/SharedPagination'
import ClienteProcesosModal from './components/ClienteProcesosModal'
import VerProcesosModal from './components/VerProcesosModal'
import { ClienteProceso, GenerarCalendarioParams, getClienteProcesosByCliente } from '../../api/clienteProcesos'
import { getAllProcesos, Proceso } from '../../api/procesos'
import { generarCalendarioClienteProceso } from '../../api/clienteProcesos'

const ClientesList: FC = () => {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)
  const [total, setTotal] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [procesos, setProcesos] = useState<Proceso[]>([])
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [showVerProcesosModal, setShowVerProcesosModal] = useState(false)
  const [clienteProcesos, setClienteProcesos] = useState<ClienteProceso[]>([])
  const [procesosList, setProcesosList] = useState<Proceso[]>([])
  const limit = 10

  useEffect(() => {
    loadClientes()
    loadInitialData()
    loadProcesos()
  }, [])

  const loadInitialData = async () => {
    try {
      const plantillasData = await getAllPlantillas()
      setPlantillas(plantillasData.plantillas || [])
    } catch (error) {
      console.error('Error al cargar plantillas:', error)
    }
  }

  const loadClientes = async () => {
    try {
      setLoading(true)
      const data = await getAllClientes(page, limit)
      setClientes(data.clientes || [])
      setTotal(data.total)
    } catch (error) {
      setError('Error al cargar los clientes')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProcesos = async () => {
    try {
      const response = await getAllProcesos()
      setProcesosList(response.procesos || [])
    } catch (error) {
      console.error('Error al cargar procesos:', error)
    }
  }

  const filteredClientes = clientes.filter((cliente) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()

    return Object.values(cliente).some((value) =>
      value?.toString().toLowerCase().includes(searchLower)
    )
  })

  const handleOpenModal = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedCliente(null)
  }

  const handleSaveClienteProceso = async (calendarios: GenerarCalendarioParams[]) => {
    try {
      for (const calendario of calendarios) {
        await generarCalendarioClienteProceso(calendario)
      }
      handleCloseModal()
      loadClientes() // Recargar la lista después de guardar
    } catch (error) {
      console.error('Error al guardar los procesos:', error)
    }
  }

  const handleVerProcesos = async (cliente: Cliente) => {
    setSelectedCliente(cliente)
    try {
      const response = await getClienteProcesosByCliente(cliente.idcliente!)
      setClienteProcesos(response.clienteProcesos || [])
      setShowVerProcesosModal(true)
    } catch (error) {
      console.error('Error al cargar los procesos:', error)
    }
  }

  return (
    <KTCard>
      <div className='card-header border-0 pt-6'>
        <div className='card-title'>
          <div className='d-flex align-items-center position-relative my-1'>
            <KTSVG
              path='/media/icons/duotune/general/gen021.svg'
              className='svg-icon-1 position-absolute ms-6'
            />
            <input
              type='text'
              className='form-control form-control-solid w-250px ps-14'
              placeholder='Buscar cliente'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className='card-toolbar'>
          <div className='d-flex justify-content-end'>
            <button
              type='button'
              className='btn btn-light'
              onClick={() => navigate('/dashboard')}
            >
              <KTSVG
                path='/media/icons/duotune/arrows/arr063.svg'
                className='svg-icon-2'
              />
              Volver
            </button>
          </div>
        </div>
      </div>
      <KTCardBody className='py-4'>
        {loading ? (
          <div className='d-flex justify-content-center'>
            <div className='spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Cargando...</span>
            </div>
          </div>
        ) : error ? (
          <div className='alert alert-danger'>{error}</div>
        ) : (
          <>
            <div className='table-responsive'>
              <table className='table align-middle table-row-dashed fs-6 gy-5'>
                <thead>
                  <tr className='text-start text-muted fw-bold fs-7 text-uppercase gs-0'>
                    <th>ID Cliente</th>
                    <th>CIF</th>
                    <th>Razón Social</th>
                    <th>Dirección</th>
                    <th>Localidad</th>
                    <th>Provincia</th>
                    <th>C.P.</th>
                    <th>País</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody className='text-gray-600 fw-semibold'>
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.idcliente}>
                      <td>{cliente.idcliente}</td>
                      <td>{cliente.cif || '-'}</td>
                      <td>{cliente.razsoc || '-'}</td>
                      <td>{cliente.direccion || '-'}</td>
                      <td>{cliente.localidad || '-'}</td>
                      <td>{cliente.provincia || '-'}</td>
                      <td>{cliente.cpostal || '-'}</td>
                      <td>{cliente.pais || '-'}</td>
                      <td>
                        <div className='d-flex gap-2'>
                          <button
                            className='btn btn-sm btn-light-primary'
                            onClick={() => handleOpenModal(cliente)}
                          >
                            <KTSVG
                              path='/media/icons/duotune/general/gen035.svg'
                              className='svg-icon-2'
                            />
                            Cargar Procesos
                          </button>
                          <button
                            className='btn btn-sm btn-light-info'
                            onClick={() => handleVerProcesos(cliente)}
                          >
                            <KTSVG
                              path='/media/icons/duotune/general/gen003.svg'
                              className='svg-icon-2'
                            />
                            Ver Procesos
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SharedPagination
              currentPage={page}
              totalItems={total}
              pageSize={limit}
              onPageChange={setPage}
            />

            <ClienteProcesosModal
              show={showModal}
              onHide={handleCloseModal}
              onSave={handleSaveClienteProceso}
              plantillas={plantillas}
              selectedCliente={selectedCliente}
              procesosList={procesosList}
            />

            <VerProcesosModal
              show={showVerProcesosModal}
              onHide={() => setShowVerProcesosModal(false)}
              cliente={selectedCliente}
              procesos={clienteProcesos}
              procesosList={procesosList}
            />
          </>
        )}
      </KTCardBody>
    </KTCard>
  )
}

export default ClientesList
