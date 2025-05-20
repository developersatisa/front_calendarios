import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createPlantilla, getPlantilla, updatePlantilla } from './plantillaAPI'
import { KTCard, KTCardBody } from '../../../_metronic/helpers'

const PlantillaForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const isEdit = Boolean(id)

  useEffect(() => {
    if (isEdit) {
      getPlantilla(Number(id)).then(res => {
        setNombre(res.data.nombre)
        setDescripcion(res.data.descripcion)
      })
    }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = { nombre, descripcion }

    if (isEdit) {
      await updatePlantilla(Number(id), data)
    } else {
      await createPlantilla(data)
    }

    navigate('/plantillas')
  }

  return (
    <KTCard>
      <KTCardBody>
        <h3 className='mb-5'>{isEdit ? 'Editar Plantilla' : 'Nueva Plantilla'}</h3>
        <form className='form' onSubmit={handleSubmit}>
          <div className='mb-5'>
            <label className='form-label'>Nombre</label>
            <input
              className='form-control form-control-solid'
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder='Nombre de la plantilla'
              required
            />
          </div>
          <div className='mb-5'>
            <label className='form-label'>Descripción</label>
            <textarea
              className='form-control form-control-solid'
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder='Descripción'
              rows={4}
            />
          </div>
          <button type='submit' className='btn btn-primary'>
            {isEdit ? 'Actualizar' : 'Crear'}
          </button>
        </form>
      </KTCardBody>
    </KTCard>
  )
}

export default PlantillaForm
