import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPlantilla } from './plantillaAPI'
import { KTCard, KTCardBody } from '../../../_metronic/helpers'

const PlantillaDetail = () => {
  const { id } = useParams()
  const [plantilla, setPlantilla] = useState(null)

  useEffect(() => {
    getPlantilla(Number(id)).then(res => setPlantilla(res.data))
  }, [id])

  if (!plantilla) return <div>Cargando...</div>

  return (
    <KTCard>
      <KTCardBody>
        <h3 className='mb-5'>Detalle de Plantilla</h3>
        <div className='mb-3'>
          <strong>ID:</strong> {plantilla.id}
        </div>
        <div className='mb-3'>
          <strong>Nombre:</strong> {plantilla.nombre}
        </div>
        <div className='mb-3'>
          <strong>Descripción:</strong> {plantilla.descripcion}
        </div>
      </KTCardBody>
    </KTCard>
  )
}

export default PlantillaDetail
