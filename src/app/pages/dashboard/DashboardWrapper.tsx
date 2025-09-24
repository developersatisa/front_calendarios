import {FC} from 'react'
import {useIntl} from 'react-intl'
import {toAbsoluteUrl} from '../../../_metronic/helpers'
import {PageTitle} from '../../../_metronic/layout/core'
import {
  ListsWidget2,
  ListsWidget3,
  ListsWidget4,
  ListsWidget6,
  TablesWidget5,
  TablesWidget10,
  MixedWidget8,
  CardsWidget7,
  CardsWidget17,
  CardsWidget20,
  ListsWidget26,
  EngageWidget10,
} from '../../../_metronic/partials/widgets'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { atisaStyles } from '../../styles/atisaStyles'

const DashboardPage: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
    {/* begin::Row */}
    <div
      className='row g-5 g-xl-10 mb-5 mb-xl-10'
      style={{
        fontFamily: atisaStyles.fonts.secondary
      }}
    >
      {/* begin::Col */}
      <div className='col-md-6 col-lg-6 col-xl-6 col-xxl-3 mb-md-5 mb-xl-10'>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
            border: `1px solid ${atisaStyles.colors.light}`,
            padding: '24px',
            marginBottom: '20px',
            height: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: atisaStyles.colors.secondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(156, 186, 57, 0.3)'
            }}
          >
            <i
              className="bi bi-folder-check"
              style={{
                fontSize: '32px',
                color: 'white'
              }}
            ></i>
          </div>
          <h4
            style={{
              fontFamily: atisaStyles.fonts.primary,
              color: atisaStyles.colors.primary,
              fontWeight: 'bold',
              fontSize: '1.5rem',
              margin: '0 0 8px 0'
            }}
          >
            Proyectos Activos
          </h4>
          <p
            style={{
              fontFamily: atisaStyles.fonts.secondary,
              color: atisaStyles.colors.dark,
              fontSize: '14px',
              margin: 0
            }}
          >
            Gestión de proyectos en curso
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
            border: `1px solid ${atisaStyles.colors.light}`,
            padding: '24px',
            height: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: atisaStyles.colors.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(0, 161, 222, 0.3)'
            }}
          >
            <i
              className="bi bi-people"
              style={{
                fontSize: '32px',
                color: 'white'
              }}
            ></i>
          </div>
          <h4
            style={{
              fontFamily: atisaStyles.fonts.primary,
              color: atisaStyles.colors.primary,
              fontWeight: 'bold',
              fontSize: '1.5rem',
              margin: '0 0 8px 0'
            }}
          >
            Profesionales
          </h4>
          <p
            style={{
              fontFamily: atisaStyles.fonts.secondary,
              color: atisaStyles.colors.dark,
              fontSize: '14px',
              margin: 0
            }}
          >
            Equipo de trabajo especializado
          </p>
        </div>
      </div>
      {/* end::Col */}

      {/* begin::Col */}
      <div className='col-md-6 col-lg-6 col-xl-6 col-xxl-3 mb-md-5 mb-xl-10'>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
            border: `1px solid ${atisaStyles.colors.light}`,
            padding: '24px',
            marginBottom: '20px',
            height: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: atisaStyles.colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(0, 80, 92, 0.3)'
            }}
          >
            <i
              className="bi bi-graph-up"
              style={{
                fontSize: '32px',
                color: 'white'
              }}
            ></i>
          </div>
          <h4
            style={{
              fontFamily: atisaStyles.fonts.primary,
              color: atisaStyles.colors.primary,
              fontWeight: 'bold',
              fontSize: '1.5rem',
              margin: '0 0 8px 0'
            }}
          >
            Métricas
          </h4>
          <p
            style={{
              fontFamily: atisaStyles.fonts.secondary,
              color: atisaStyles.colors.dark,
              fontSize: '14px',
              margin: 0
            }}
          >
            Análisis de rendimiento
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
            border: `1px solid ${atisaStyles.colors.light}`,
            padding: '24px',
            height: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: atisaStyles.colors.light,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(128, 224, 211, 0.3)'
            }}
          >
            <i
              className="bi bi-list-ul"
              style={{
                fontSize: '32px',
                color: atisaStyles.colors.primary
              }}
            ></i>
          </div>
          <h4
            style={{
              fontFamily: atisaStyles.fonts.primary,
              color: atisaStyles.colors.primary,
              fontWeight: 'bold',
              fontSize: '1.5rem',
              margin: '0 0 8px 0'
            }}
          >
            Listas
          </h4>
          <p
            style={{
              fontFamily: atisaStyles.fonts.secondary,
              color: atisaStyles.colors.dark,
              fontSize: '14px',
              margin: 0
            }}
          >
            Elementos organizados
          </p>
        </div>
      </div>
      {/* end::Col */}

      {/* begin::Col */}
      <div className='col-xxl-6'>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
            border: `1px solid ${atisaStyles.colors.light}`,
            padding: '32px',
            height: '400px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              backgroundColor: atisaStyles.colors.secondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              boxShadow: '0 6px 20px rgba(156, 186, 57, 0.4)'
            }}
          >
            <i
              className="bi bi-calendar-check"
              style={{
                fontSize: '40px',
                color: 'white'
              }}
            ></i>
          </div>
          <h3
            style={{
              fontFamily: atisaStyles.fonts.primary,
              color: atisaStyles.colors.primary,
              fontWeight: 'bold',
              fontSize: '2rem',
              margin: '0 0 16px 0'
            }}
          >
            Sistema de Gestión
          </h3>
          <p
            style={{
              fontFamily: atisaStyles.fonts.secondary,
              color: atisaStyles.colors.dark,
              fontSize: '16px',
              margin: '0 0 24px 0',
              lineHeight: '1.6'
            }}
          >
            Plataforma integral para la gestión de calendarios y documentos empresariales
          </p>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            <span
              style={{
                backgroundColor: atisaStyles.colors.light,
                color: atisaStyles.colors.primary,
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: atisaStyles.fonts.secondary
              }}
            >
              Calendarios
            </span>
            <span
              style={{
                backgroundColor: atisaStyles.colors.light,
                color: atisaStyles.colors.primary,
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: atisaStyles.fonts.secondary
              }}
            >
              Documentos
            </span>
            <span
              style={{
                backgroundColor: atisaStyles.colors.light,
                color: atisaStyles.colors.primary,
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: atisaStyles.fonts.secondary
              }}
            >
              Procesos
            </span>
          </div>
        </div>
      </div>
      {/* end::Col */}
    </div>
    {/* end::Row */}
    </Content>
  </>
)

const DashboardWrapper: FC = () => {
  const intl = useIntl()
  return (
    <>
      <PageTitle breadcrumbs={[]}>{intl.formatMessage({id: 'MENU.DASHBOARD'})}</PageTitle>
      <DashboardPage />
    </>
  )
}

export {DashboardWrapper}
