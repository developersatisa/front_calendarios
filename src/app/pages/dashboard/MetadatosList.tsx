import React, { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KTCard, KTCardBody, KTSVG } from '../../../_metronic/helpers'
import { Metadato, getAllMetadatos, createMetadato, updateMetadato, deleteMetadato } from '../../api/metadatos'
import { MetadatoArea, getAllMetadatosArea, createMetadatoArea } from '../../api/metadatosArea'
import { Subdepartamento, getAllSubdepartamentos } from '../../api/subdepartamentos'
import SharedPagination from '../../components/pagination/SharedPagination'
import MetadatoModal from './components/MetadatoModal'
import MetadatoSubdepartamentosModal from './components/MetadatoSubdepartamentosModal'

const MetadatosList: FC = () => {
  const navigate = useNavigate()
  const [metadatos, setMetadatos] = useState<Metadato[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para paginación y ordenamiento
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [sortField, setSortField] = useState('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('')

  // Estados para el modal
  const [showModal, setShowModal] = useState(false)
  const [editingMetadato, setEditingMetadato] = useState<Metadato | null>(null)

  // Estados para subdepartamentos y asociaciones
  const [subdepartamentos, setSubdepartamentos] = useState<Subdepartamento[]>([])
  const [metadatosArea, setMetadatosArea] = useState<MetadatoArea[]>([])
  const [showSubdepartamentosModal, setShowSubdepartamentosModal] = useState(false)
  const [selectedMetadatoForAreas, setSelectedMetadatoForAreas] = useState<Metadato | null>(null)

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

  const loadAll = async () => {
    try {
      setLoading(true)
      const [metadatosData, subdepartamentosData, metadatosAreaData] = await Promise.all([
        getAllMetadatos(page, limit, sortField, sortDirection),
        getAllSubdepartamentos(),
        getAllMetadatosArea()
      ])
      setMetadatos(metadatosData.metadatos || [])
      setTotal(metadatosData.total || 0)
      setSubdepartamentos(subdepartamentosData.subdepartamentos || [])
      setMetadatosArea(metadatosAreaData || [])
      setError(null)
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setMetadatos([])
        setTotal(0)
        setError(null)
      } else {
        setError('Error al cargar los datos')
        console.error('Error:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [page, limit, sortField, sortDirection])

  // Filtrar metadatos por término de búsqueda
  const filteredMetadatos = metadatos.filter(metadato =>
    metadato.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (metadato.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    metadato.tipo_generacion.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Agrupar metadatos-area por metadato
  const groupedMetadatosArea = metadatosArea.reduce((groups, ma) => {
    if (!groups[ma.id_metadato]) {
      groups[ma.id_metadato] = []
    }
    const subdep = subdepartamentos.find(s => s.ceco === ma.codigo_ceco && s.ceco !== null)
    if (subdep) {
      groups[ma.id_metadato].push({ ...ma, subdepData: subdep })
    }
    return groups
  }, {} as Record<number, Array<MetadatoArea & { subdepData: Subdepartamento }>>)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleCreate = () => {
    setEditingMetadato(null)
    setShowModal(true)
  }

  const handleEdit = (metadato: Metadato) => {
    setEditingMetadato(metadato)
    setShowModal(true)
  }

  const handleSave = async (metadatoData: Omit<Metadato, 'id'>) => {
    try {
      // Transformar global_ a global para el backend
      const dataForBackend = {
        ...metadatoData,
        global: metadatoData.global_
      }
      // Eliminar global_ del objeto que se envía
      delete (dataForBackend as any).global_

      if (editingMetadato) {
        await updateMetadato(editingMetadato.id, dataForBackend)
      } else {
        await createMetadato(dataForBackend)
      }
      setShowModal(false)
      setEditingMetadato(null)
      await loadAll()
    } catch (error) {
      console.error('Error al guardar metadato:', error)
      setError('Error al guardar el metadato')
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este metadato?')) {
      try {
        await deleteMetadato(id)
        await loadAll()
      } catch (error) {
        console.error('Error al eliminar metadato:', error)
        setError('Error al eliminar el metadato')
      }
    }
  }

  const handleAsignarDepartamentos = (metadato: Metadato) => {
    setSelectedMetadatoForAreas(metadato)
    setShowSubdepartamentosModal(true)
  }

  const handleSaveSubdepartamentos = async (newRelations: { id_metadato: number; codigo_ceco: string }[]) => {
    try {
      const promises = newRelations.map(relation => createMetadatoArea(relation))
      await Promise.all(promises)
      await loadAll()
      setShowSubdepartamentosModal(false)
    } catch (error) {
      console.error('Error al guardar subdepartamentos:', error)
      setError('Error al guardar los subdepartamentos')
    }
  }

  return (
    <>
      <KTCard>
        <div className='card-header border-0 pt-6'>
          <div className='card-title'>
            <div className='d-flex align-items-center position-relative my-1'>
              <i className='bi bi-search position-absolute ms-6'></i>
              <input
                type='text'
                className='form-control form-control-solid w-250px ps-14'
                placeholder='Buscar metadatos...'
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div className='card-toolbar'>
            <div className='d-flex justify-content-end gap-2'>
              <button
                type='button'
                className='btn btn-light'
                onClick={() => navigate('/dashboard')}
              >
                <i className="bi bi-arrow-left"></i>
                Volver
              </button>
              <button type='button' className='btn btn-primary' onClick={handleCreate}>
                <i className='bi bi-plus-circle me-2'></i>
                Nuevo Metadato
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
                        onClick={() => handleSort('id')}
                        style={{ transition: 'all 0.2s' }}
                      >
                        ID {getSortIcon('id')}
                      </th>
                      <th
                        className='cursor-pointer user-select-none hover-primary'
                        onClick={() => handleSort('nombre')}
                        style={{ transition: 'all 0.2s' }}
                      >
                        Nombre {getSortIcon('nombre')}
                      </th>
                      <th
                        className='cursor-pointer user-select-none hover-primary'
                        onClick={() => handleSort('descripcion')}
                        style={{ transition: 'all 0.2s' }}
                      >
                        Descripción {getSortIcon('descripcion')}
                      </th>
                      <th
                        className='cursor-pointer user-select-none hover-primary'
                        onClick={() => handleSort('tipo_generacion')}
                        style={{ transition: 'all 0.2s' }}
                      >
                        Tipo Generación {getSortIcon('tipo_generacion')}
                      </th>
                      <th
                        className='cursor-pointer user-select-none hover-primary'
                        onClick={() => handleSort('global_')}
                        style={{ transition: 'all 0.2s' }}
                      >
                        Global {getSortIcon('global_')}
                      </th>
                      <th
                        className='cursor-pointer user-select-none hover-primary'
                        onClick={() => handleSort('activo')}
                        style={{ transition: 'all 0.2s' }}
                      >
                        Estado {getSortIcon('activo')}
                      </th>
                      <th>Departamentos Asociados</th>
                      <th className='text-start'>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className='text-gray-600 fw-semibold'>
                    {filteredMetadatos.map((metadato) => (
                      <tr key={metadato.id}>
                        <td>{metadato.id}</td>
                        <td>
                          <div className='d-flex flex-column'>
                            <span className='fw-bold'>{metadato.nombre}</span>
                          </div>
                        </td>
                        <td>{metadato.descripcion || '-'}</td>
                        <td>
                          <span className={`badge badge-light-${metadato.tipo_generacion === 'automatico' ? 'success' : metadato.tipo_generacion === 'manual' ? 'primary' : 'warning'}`}>
                            {metadato.tipo_generacion}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-light-${metadato.global_ ? 'success' : 'secondary'}`}>
                            {metadato.global_ ? 'Sí' : 'No'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-light-${metadato.activo ? 'success' : 'danger'}`}>
                            {metadato.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          {metadato.global_ ? (
                            <span className='text-muted fst-italic'>Global - Aplica a todos los departamentos</span>
                          ) : (
                            <div className='d-flex flex-column gap-2' style={{ maxHeight: '150px', overflowY: 'auto' }}>
                              {groupedMetadatosArea[metadato.id]?.map((ma) => (
                                <div key={ma.id} className='d-flex align-items-center'>
                                  <span className='badge badge-light-info me-2'>{ma.subdepData.ceco || '-'}</span>
                                  <span className='text-sm'>{ma.subdepData.nombre || '-'}</span>
                                </div>
                              ))}
                              {(!groupedMetadatosArea[metadato.id] || groupedMetadatosArea[metadato.id].length === 0) && (
                                <span className='text-muted'>Sin departamentos</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className='text-start'>
                          <div className='d-flex gap-2'>
                            {!metadato.global_ && (
                              <button
                                className='btn btn-sm btn-light-info'
                                onClick={() => handleAsignarDepartamentos(metadato)}
                              >
                                <i className='bi bi-building me-2'></i>
                                Asignar Departamentos
                              </button>
                            )}
                            <div className='dropdown' style={{ position: 'static' }}>
                              <button
                                className='btn btn-sm btn-light btn-active-light-primary'
                                type='button'
                                data-bs-toggle='dropdown'
                                aria-expanded='false'
                              >
                                Acciones
                                <i className="bi bi-chevron-down ms-1"></i>
                              </button>
                              <ul className='dropdown-menu dropdown-menu-start menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-bold fs-7 w-125px py-4'>
                                <li className='menu-item px-3'>
                                  <a
                                    href='#'
                                    className='menu-link px-3'
                                    onClick={(e) => {
                                      e.preventDefault()
                                      handleEdit(metadato)
                                    }}
                                  >
                                    <i className="bi bi-pencil-square me-2"></i>
                                    Editar
                                  </a>
                                </li>
                                {metadato.tipo_generacion !== 'automatico' && (
                                  <li className='menu-item px-3'>
                                    <a
                                      href='#'
                                      className='menu-link px-3 text-danger'
                                      onClick={(e) => {
                                        e.preventDefault()
                                        handleDelete(metadato.id)
                                      }}
                                    >
                                      <i className="bi bi-trash3 me-2"></i>
                                      Eliminar
                                    </a>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredMetadatos.length === 0 && !loading && (
                <div className='text-center py-4'>
                  <span className='text-muted'>No se encontraron metadatos</span>
                </div>
              )}

              <SharedPagination
                currentPage={page}
                totalItems={total}
                pageSize={limit}
                onPageChange={setPage}
              />
            </>
          )}
        </KTCardBody>
      </KTCard>

      <MetadatoModal
        show={showModal}
        onHide={() => {
          setShowModal(false)
          setEditingMetadato(null)
        }}
        onSave={handleSave}
        metadato={editingMetadato}
      />

      <MetadatoSubdepartamentosModal
        show={showSubdepartamentosModal}
        onHide={() => setShowSubdepartamentosModal(false)}
        onSave={handleSaveSubdepartamentos}
        metadatos={metadatos}
        subdepartamentos={subdepartamentos}
        areasActuales={metadatosArea}
        selectedMetadatoId={selectedMetadatoForAreas?.id || 0}
      />
    </>
  )
}

export default MetadatosList
