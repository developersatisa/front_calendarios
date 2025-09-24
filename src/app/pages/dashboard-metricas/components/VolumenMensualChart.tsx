import React, {useEffect, useRef} from 'react'
import ApexCharts, {ApexOptions} from 'apexcharts'
import {getCSS, getCSSVariableValue} from '../../../../_metronic/assets/ts/_utils'
import {useThemeMode} from '../../../../_metronic/partials/layout/theme-mode/ThemeModeProvider'
import {VolumenData} from '../../../api/metricas'

type Props = {
  className: string
  volumenData: VolumenData[]
}

const VolumenMensualChart: React.FC<Props> = ({className, volumenData}) => {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const {mode} = useThemeMode()

  const refreshChart = () => {
    if (!chartRef.current) {
      return
    }

    const height = parseInt(getCSS(chartRef.current, 'height'))
    const chart = new ApexCharts(chartRef.current, getChartOptions(height, volumenData))
    if (chart) {
      chart.render()
    }

    return chart
  }

  useEffect(() => {
    const chart = refreshChart()

    return () => {
      if (chart) {
        chart.destroy()
      }
    }
  }, [chartRef, mode, volumenData])

  return (
    <div className={`${className}`}>
      <div ref={chartRef} style={{height: '350px'}} />
    </div>
  )
}

function getChartOptions(height: number, volumenData: VolumenData[]): ApexOptions {
  const labelColor = getCSSVariableValue('--bs-gray-500')
  const borderColor = getCSSVariableValue('--bs-gray-200')
  const baseColor = getCSSVariableValue('--bs-primary')
  const baseLightColor = getCSSVariableValue('--bs-primary-light')
  const secondaryColor = getCSSVariableValue('--bs-info')

  const categories = volumenData.map(item => item.mes)
  const creadosData = volumenData.map(item => item.hitosCreados)
  const completadosData = volumenData.map(item => item.hitosCompletados)

  return {
    series: [
      {
        name: 'Hitos Creados',
        type: 'bar',
        data: creadosData,
      },
      {
        name: 'Hitos Completados',
        type: 'bar',
        data: completadosData,
      },
      {
        name: 'Tendencia',
        type: 'area',
        data: volumenData.map(item => (item.hitosCreados + item.hitosCompletados) / 2),
      },
    ],
    chart: {
      fontFamily: 'inherit',
      stacked: true,
      height: height,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 5,
        columnWidth: '12%',
      },
    },
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: labelColor,
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: labelColor,
          fontSize: '12px',
        },
      },
    },
    fill: {
      opacity: 1,
    },
    states: {
      normal: {
        filter: {
          type: 'none',
          value: 0,
        },
      },
      hover: {
        filter: {
          type: 'none',
          value: 0,
        },
      },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: 'none',
          value: 0,
        },
      },
    },
    tooltip: {
      style: {
        fontSize: '12px',
      },
      y: {
        formatter: function (val) {
          return val + ' hitos'
        },
      },
    },
    colors: [baseColor, secondaryColor, baseLightColor],
    grid: {
      borderColor: borderColor,
      strokeDashArray: 4,
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
  }
}

export {VolumenMensualChart}