import React, { useEffect, useState } from 'react'
import { KTCard, KTCardBody, KTSVG } from '../../../_metronic/helpers'
import { getPlantillas, deletePlantilla } from './plantillaAPI'
import { Link } from 'react-router-dom'

const PlantillaList = () => {
  const [plantillas, setPlantillas] = useState([])

  const fetchPlantillas = () => {
    getPlantillas().then(res => setPlantillas(res.data))
  }

  useEffect(() => {
    fetchPlantillas()
  }, [])

  const handleDelete = async (id) => {
    await deletePlantilla(id)
    fetchPlantillas()
  }

  return (
    <KTCard>
      <KTCardBody>
        <div className='d-flex justify-content-between align-items-center mb-5'>
          <h3 className='mb-0'>Gestión de Plantillas</h3>
          <Link to='/plantillas/crear' className='btn btn-primary'>
            <KTSVG path='/media/icons/duotune/general/gen005.svg' className='svg-icon-2' />
            Nueva Plantilla
          </Link>
        </div>

        <table className='table table-striped table-row-bordered gy-5 gs-7 border rounded'>
          <thead className='bg-light fw-bold'>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th className='text-end'>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {plantillas.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.nombre}</td>
                <td>{p.descripcion}</td>
                <td className='text-end'>
                  <Link to={`/plantillas/editar/${p.id}`} className='btn btn-sm btn-light-warning me-2'>
                    Editar
                  </Link>
                  <button className='btn btn-sm btn-light-danger' onClick={() => handleDelete(p.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </KTCardBody>
    </KTCard>
  )
}

export default PlantillaList
