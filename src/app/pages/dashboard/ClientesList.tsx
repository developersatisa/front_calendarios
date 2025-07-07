import React, { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KTCard, KTCardBody } from '../../../_metronic/helpers'
import { Cliente, getAllClientes } from '../../api/clientes'
import { getAllPlantillas, Plantilla } from '../../api/plantillas'
import SharedPagination from '../../components/pagination/SharedPagination'
import ClienteProcesosModal from './components/ClienteProcesosModal'
import { GenerarCalendarioParams } from '../../api/clienteProcesos'
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
  const [sortField, setSortField] = useState<string>('idcliente')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showModal, setShowModal] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [procesosList, setProcesosList] = useState<Proceso[]>([])
  const limit = 10

  useEffect(() => {
    loadInitialData()
    loadProcesos()
  }, [])

  useEffect(() => {
    loadClientes()
  }, [page, sortField, sortDirection])

  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    } else {
      loadClientes()
    }
  }, [searchTerm])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1) // Reset to first page when sorting changes
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return (
        <span className='ms-1 text-muted'>
          <i className='bi bi-arrow-down-up' style={{ fontSize: '12px' }}></i>
        </span>
      )
    }
    return (
      <span className='ms-1 text-primary'>
        <i className={`bi ${sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}`} style={{ fontSize: '12px' }}></i>
      </span>
    )
  }

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
      const data = await getAllClientes(page, limit, sortField, sortDirection)
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

  return (
    <KTCard>
      <div className='card-header border-0 pt-6'>
        <div className='card-title'>
          <div className='d-flex align-items-center position-relative my-1'>
            <i className='bi bi-search position-absolute ms-6'></i>
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
              <i className="bi bi-arrow-left"></i>
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
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('idcliente')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      ID {getSortIcon('idcliente')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('cif')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      CIF {getSortIcon('cif')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('razsoc')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      Razón Social {getSortIcon('razsoc')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('direccion')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      Dirección {getSortIcon('direccion')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('localidad')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      Localidad {getSortIcon('localidad')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('provincia')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      Provincia {getSortIcon('provincia')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('cpostal')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      C.P. {getSortIcon('cpostal')}
                    </th>
                    <th
                      className='cursor-pointer user-select-none hover-primary'
                      onClick={() => handleSort('pais')}
                      style={{ transition: 'all 0.2s' }}
                    >
                      País {getSortIcon('pais')}
                    </th>
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
                            <i className='bi bi-plus-circle me-2'></i>
                            Generar Calendario
                          </button>
                          <button
                            className='btn btn-sm btn-light-info'
                            onClick={() => navigate(`/cliente-calendario/${cliente.idcliente}`)}
                          >
                            <i className='bi bi-eye me-2'></i>
                            Ver Calendario
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
          </>
        )}
      </KTCardBody>
    </KTCard>
  )
}

export default ClientesList
