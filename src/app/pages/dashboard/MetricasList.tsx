import React, { FC, useState, useEffect } from 'react'
import { KTCard, KTCardBody, KTSVG } from '../../../_metronic/helpers'
import { 
  getResumenMetricas, 
  getCumplimientoHitos,
  getHitosPorProceso,
  getTiempoResolucion,
  getVolumenMensual,
  ResumenMetricasResponse,
  CumplimientoHitosResponse,
  HitosPorProcesoResponse,
  TiempoResolucionResponse,
  VolumenMensualResponse
} from '../../api/metricas'
import { CumplimientoHitosChart } from './components/CumplimientoHitosChart'
import { HitosPorProcesoChart } from './components/HitosPorProcesoChart'
import { TiempoResolucionChart } from './components/TiempoResolucionChart'
import { VolumenMensualChart } from './components/VolumenMensualChart'

const MetricasList: FC = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [metricasData, setMetricasData] = useState<ResumenMetricasResponse | null>(null)
  const [cumplimientoData, setCumplimientoData] = useState<CumplimientoHitosResponse | null>(null)
  const [procesosData, setProcesosData] = useState<HitosPorProcesoResponse | null>(null)
  const [resolucionData, setResolucionData] = useState<TiempoResolucionResponse | null>(null)
  const [volumenData, setVolumenData] = useState<VolumenMensualResponse | null>(null)

  // Cargar datos de métricas al montar el componente
  useEffect(() => {
    loadMetricas()
  }, [])

  const loadMetricas = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Cargar todas las métricas en paralelo
      const [resumen, cumplimiento, procesos, resolucion, volumen] = await Promise.all([
        getResumenMetricas(),
        getCumplimientoHitos(),
        getHitosPorProceso(),
        getTiempoResolucion(),
        getVolumenMensual()
      ])
      
      setMetricasData(resumen)
      setCumplimientoData(cumplimiento)
      setProcesosData(procesos)
      setResolucionData(resolucion)
      setVolumenData(volumen)
    } catch (error) {
      console.error('Error al cargar métricas:', error)
      setError('Error al cargar las métricas')
    } finally {
      setLoading(false)
    }
  }

  // Configuración de métricas con datos reales
  const getMetricas = () => {
    if (!metricasData) return []

    return [
      {
        id: 1,
        titulo: 'Hitos Completados',
        valor: metricasData.hitosCompletados.valor,
        porcentaje: metricasData.hitosCompletados.tendencia,
        tendencia: metricasData.hitosCompletados.tendencia.startsWith('+') ? 'up' : 'down',
        descripcion: 'Cumplimiento general',
        icono: 'flag',
        color: 'success'
      },
      {
        id: 2,
        titulo: 'Hitos Pendientes',
        valor: metricasData.hitosPendientes.valor.toString(),
        porcentaje: metricasData.hitosPendientes.tendencia,
        tendencia: metricasData.hitosPendientes.tendencia.startsWith('+') ? 'up' : 'down',
        descripcion: 'En proceso',
        icono: 'time',
        color: 'warning'
      },
      {
        id: 3,
        titulo: 'Hitos Vencidos',
        valor: metricasData.hitosVencidos.valor.toString(),
        porcentaje: metricasData.hitosVencidos.tendencia,
        tendencia: metricasData.hitosVencidos.tendencia.startsWith('+') ? 'up' : 'down',
        descripcion: 'Requieren atención',
        icono: 'warning',
        color: 'danger'
      },
      {
        id: 4,
        titulo: 'Clientes Inactivos',
        valor: metricasData.clientesInactivos.valor.toString(),
        porcentaje: metricasData.clientesInactivos.tendencia,
        tendencia: metricasData.clientesInactivos.tendencia.startsWith('+') ? 'up' : 'down',
        descripcion: 'Sin hitos activos',
        icono: 'user',
        color: 'info'
      }
    ]
  }

  const getIconPath = (icon: string) => {
    const iconMap: {[key: string]: string} = {
      user: '/media/icons/duotune/general/gen021.svg',
      flow: '/media/icons/duotune/general/gen027.svg',
      flag: '/media/icons/duotune/general/gen003.svg',
      copy: '/media/icons/duotune/files/fil012.svg',
      time: '/media/icons/duotune/general/gen014.svg',
      warning: '/media/icons/duotune/general/gen035.svg'
    }
    return iconMap[icon] || '/media/icons/duotune/general/gen003.svg'
  }

  const getTendenciaColor = (tendencia: string) => {
    return tendencia === 'up' ? 'text-success' : 'text-danger'
  }

  const getTendenciaIcon = (tendencia: string) => {
    return tendencia === 'up' ? 'arrow-up' : 'arrow-down'
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-7">
          <div>
            <h1 className="d-flex align-items-center text-dark fw-bolder fs-3 my-1">
              Métricas
              <span className="h-20px border-gray-200 border-start ms-3 mx-2"></span>
              <small className="text-muted fs-7 fw-normal">Dashboard de métricas del sistema</small>
            </h1>
          </div>
        </div>

        {/* Métricas Cards */}
        {loading && (
          <div className="d-flex justify-content-center mb-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger mb-5" role="alert">
            {error}
            <button 
              type="button" 
              className="btn btn-sm btn-light-danger ms-3"
              onClick={loadMetricas}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="row g-5 g-xl-8 mb-5 mb-xl-8">
            {getMetricas().map((metrica) => (
            <div className="col-xl-3" key={metrica.id}>
              <KTCard className={`bg-light-${metrica.color} card-xl-stretch h-175px`}>
                <div className="card-body d-flex flex-column p-6">
                  {/* Header con icono y título */}
                  <div className="d-flex align-items-center mb-4">
                    <KTSVG 
                      path={getIconPath(metrica.icono)} 
                      className={`svg-icon svg-icon-2x svg-icon-${metrica.color} me-3`} 
                    />
                    <div className="flex-grow-1">
                      <h4 className="fs-6 fw-bold text-gray-800 mb-1">{metrica.titulo}</h4>
                      <span className="fs-7 text-muted">{metrica.descripcion}</span>
                    </div>
                  </div>
                  
                  {/* Valor y tendencia */}
                  <div className="d-flex align-items-center justify-content-between mt-auto">
                    <div className="fs-2x fw-bolder text-dark">{metrica.valor}</div>
                    <div className="d-flex align-items-center">
                      <KTSVG 
                        path={`/media/icons/duotune/arrows/arr${metrica.tendencia === 'up' ? '065' : '066'}.svg`}
                        className={`svg-icon svg-icon-5 ${getTendenciaColor(metrica.tendencia)} me-1`}
                      />
                      <span className={`fw-bold fs-6 ${getTendenciaColor(metrica.tendencia)}`}>
                        {metrica.porcentaje}
                      </span>
                    </div>
                  </div>
                </div>
              </KTCard>
            </div>
          ))}
          </div>
        )}

        {/* Gráficos de Métricas */}
        {!loading && !error && (
          <>
            <div className="row g-5 g-xl-8 mb-5 mb-xl-8">
              {/* Porcentaje de cumplimiento de hitos por cliente */}
              <div className="col-xl-6">
                <KTCard className="h-450px">
                  <div className="card-header border-0 pt-5">
                    <h3 className="card-title align-items-start flex-column">
                      <span className="card-label fw-bolder fs-3 mb-1">Cumplimiento de Hitos</span>
                      <span className="text-muted fw-bold fs-7">Porcentaje general</span>
                    </h3>
                  </div>
                  <KTCardBody className="pt-0">
                    {cumplimientoData && (
                      <CumplimientoHitosChart
                        chartColor="primary"
                        chartHeight="280px"
                        porcentaje={cumplimientoData.porcentajeGeneral}
                      />
                    )}
                  </KTCardBody>
                </KTCard>
              </div>

              {/* Hitos por tipo de proceso */}
              <div className="col-xl-6">
                <KTCard className="h-450px">
                  <div className="card-header border-0 pt-5">
                    <h3 className="card-title align-items-start flex-column">
                      <span className="card-label fw-bolder fs-3 mb-1">Hitos por Proceso</span>
                      <span className="text-muted fw-bold fs-7">Distribución por tipo</span>
                    </h3>
                  </div>
                  <KTCardBody className="pt-0">
                    {procesosData && (
                      <HitosPorProcesoChart
                        className="card-xl-stretch"
                        procesoData={procesosData.procesoData}
                      />
                    )}
                  </KTCardBody>
                </KTCard>
              </div>
            </div>

            <div className="row g-5 g-xl-8 mb-5 mb-xl-8">
              {/* Tiempo medio de resolución */}
              <div className="col-xl-6">
                <KTCard className="h-450px">
                  <div className="card-header border-0 pt-5">
                    <h3 className="card-title align-items-start flex-column">
                      <span className="card-label fw-bolder fs-3 mb-1">Tiempo de Resolución</span>
                      <span className="text-muted fw-bold fs-7">Evolución temporal</span>
                    </h3>
                  </div>
                  <KTCardBody className="pt-0">
                    {resolucionData && (
                      <TiempoResolucionChart
                        className="card-xl-stretch"
                        resolucionData={resolucionData.resolucionData}
                      />
                    )}
                  </KTCardBody>
                </KTCard>
              </div>

              {/* Volumen mensual de hitos */}
              <div className="col-xl-6">
                <KTCard className="h-450px">
                  <div className="card-header border-0 pt-5">
                    <h3 className="card-title align-items-start flex-column">
                      <span className="card-label fw-bolder fs-3 mb-1">Volumen Mensual</span>
                      <span className="text-muted fw-bold fs-7">Creados vs Completados</span>
                    </h3>
                  </div>
                  <KTCardBody className="pt-0">
                    {volumenData && (
                      <VolumenMensualChart
                        className="card-xl-stretch"
                        volumenData={volumenData.volumenData}
                      />
                    )}
                  </KTCardBody>
                </KTCard>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MetricasList