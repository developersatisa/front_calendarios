import {FC, useState, useEffect} from 'react'
import {KTCard, KTCardBody} from '../../../_metronic/helpers'
import {Cliente, getAllClientes} from '../../api/clientes'
import SharedPagination from '../../components/pagination/SharedPagination'
import {useNavigate} from 'react-router-dom'

const ClientesDocumentalCalendarioList: FC = () => {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10
  const [allClientes, setAllClientes] = useState<Cliente[]>([])
  const [sortField, setSortField] = useState<string>('idcliente')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Cargar todos los clientes al inicio
  useEffect(() => {
    loadAllClientes()
  }, [])

  // Cargar la página actual
  useEffect(() => {
    if (!searchTerm) {
      loadClientes()
    }
  }, [page, sortField, sortDirection])

  const loadAllClientes = async () => {
    try {
      const response = await getAllClientes() // Sin parámetros para obtener todos
      setAllClientes(response.clientes || [])
    } catch (error) {
      console.error('Error al cargar todos los clientes:', error)
    }
  }

  const loadClientes = async () => {
    try {
      setLoading(true)
      const response = await getAllClientes(page, limit, sortField, sortDirection)
      setClientes(response.clientes || [])
      setTotal(response.total || 0)
    } catch (error) {
      setError('Error al cargar las empresas')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    if (value) {
      // Filtrar de todos los clientes
      const filtered = allClientes.filter((cliente) => {
        const searchLower = value.toLowerCase()
        return (
          cliente.idcliente.toLowerCase().includes(searchLower) ||
          (cliente.razsoc?.toLowerCase().includes(searchLower) || false) ||
          (cliente.cif?.toLowerCase().includes(searchLower) || false) ||
          (cliente.localidad?.toLowerCase().includes(searchLower) || false)
        )
      })
      setClientes(filtered)
      setTotal(filtered.length)
    } else {
      // Si no hay término de búsqueda, volver a la paginación normal
      loadClientes()
    }
  }

  const handleCalendarClick = (clienteId: string) => {
    navigate(`/cliente-calendario/${clienteId}`)
  }

  return (
    <>
      <div className='text-center mb-8'>
        <h1>Gestor Documental/calendario</h1>
        <h4 className='text-muted'>Directorio de empresas</h4>
      </div>

      <div className='mb-6'>
        <div className='input-group'>
          <input
            type='text'
            className='form-control'
            placeholder='Buscar por ID, razón social, CIF o localidad...'
            value={searchTerm}
            onChange={handleSearch}
          />
          <button className='btn btn-primary' type='button'>
            <i className='bi bi-search'></i>
          </button>
        </div>
      </div>

      <div className='table-responsive'>
        <table className='table table-hover table-rounded table-striped border gy-7 gs-7'>
          <thead>
            <tr className='fw-semibold fs-6 text-gray-800 border-bottom-2 border-gray-200'>
              <th
                className='cursor-pointer user-select-none hover-primary'
                onClick={() => handleSort('idcliente')}
                style={{ transition: 'all 0.2s' }}
              >
                ID {getSortIcon('idcliente')}
              </th>
              <th
                className='cursor-pointer user-select-none hover-primary'
                onClick={() => handleSort('razsoc')}
                style={{ transition: 'all 0.2s' }}
              >
                Empresa {getSortIcon('razsoc')}
              </th>
              <th className='text-end'>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente, index) => (
              <tr key={cliente.idcliente}>
                <td>{cliente.idcliente}</td>
                <td>{cliente.razsoc || cliente.idcliente}</td>
                <td className='text-end'>
                  <button
                    className='btn btn-icon btn-light-success btn-sm'
                    title='Calendario'
                    onClick={() => handleCalendarClick(cliente.idcliente)}
                  >
                    <i className='bi bi-calendar fs-5'></i>
                  </button>
                  <button
                    className='btn btn-icon btn-light-primary btn-sm me-2'
                    title='Gestor Documental'
                    onClick={() => navigate('/gestor-documental')}
                  >
                    <i className="bi bi-file-earmark-text"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mostrar paginación siempre que haya datos */}
      {!loading && !error && clientes.length > 0 && (
        <div className='d-flex justify-content-end mt-5'>
          <SharedPagination
            currentPage={page}
            totalItems={total}
            pageSize={limit}
            onPageChange={setPage}
          />
        </div>
      )}

      {loading && (
        <div className='text-center py-4'>
          <div className='spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Cargando...</span>
          </div>
        </div>
      )}

      {error && (
        <div className='alert alert-danger'>{error}</div>
      )}

      {!loading && !error && clientes.length === 0 && (
        <div className='text-center text-muted py-4'>
          No se encontraron empresas
        </div>
      )}
    </>
  )
}

export default ClientesDocumentalCalendarioList
