import {FC} from 'react'
import {KTSVG} from '../../../../../_metronic/helpers'
import {ClienteProceso} from '../../../../api/clienteProcesos'
import {Proceso} from '../../../../api/procesos'

interface Props {
  procesos: ClienteProceso[]
  procesosMaestros: Proceso[]
  onShowHitos: (procesoId: number) => void
}

const ProcesosLista: FC<Props> = ({procesos, procesosMaestros, onShowHitos}) => {
  return (
    <div className='row g-5 g-xl-8'>
      {procesos.map(proceso => {
        const procesoMaestro = procesosMaestros.find(p => p.id === proceso.id_proceso)
        if (!procesoMaestro) return null

        return (
          <div className='col-xl-4' key={proceso.id}>
            <div className='card card-xl-stretch mb-xl-8'>
              <div className='card-header border-0'>
                <h3 className='card-title align-items-start flex-column'>
                  <span className='card-label fw-bold fs-3 mb-1'>
                    {procesoMaestro.nombre}
                  </span>
                  <span className='text-muted mt-1 fw-semibold fs-7'>
                    {new Date(proceso.fecha_inicio).toLocaleDateString()} -
                    {proceso.fecha_fin ? new Date(proceso.fecha_fin).toLocaleDateString() : 'Sin fecha fin'}
                  </span>
                </h3>
                <div className='card-toolbar'>
                  <button
                    type='button'
                    className='btn btn-sm btn-icon btn-color-primary btn-active-light-primary'
                    onClick={() => onShowHitos(proceso.id_proceso)}
                  >
                    <KTSVG path='/media/icons/duotune/general/gen014.svg' className='svg-icon-2' />
                  </button>
                </div>
              </div>
              <div className='card-body pt-2'>
                {procesoMaestro.descripcion && (
                  <span className='text-muted fw-semibold d-block'>
                    {procesoMaestro.descripcion}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ProcesosLista
