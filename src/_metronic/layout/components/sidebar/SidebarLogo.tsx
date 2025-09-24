import {Link} from 'react-router-dom'
import clsx from 'clsx'
import {KTIcon, toAbsoluteUrl} from '../../../helpers'
import {useLayout} from '../../core'
import {MutableRefObject, useEffect, useRef} from 'react'
import {ToggleComponent} from '../../../assets/ts/components'
import {atisaStyles} from '../../../../app/styles/atisaStyles'

type PropsType = {
  sidebarRef: MutableRefObject<HTMLDivElement | null>
}

const SidebarLogo = (props: PropsType) => {
  const {config} = useLayout()
  const toggleRef = useRef<HTMLDivElement>(null)

  const appSidebarDefaultMinimizeDesktopEnabled =
    config?.app?.sidebar?.default?.minimize?.desktop?.enabled
  const appSidebarDefaultCollapseDesktopEnabled =
    config?.app?.sidebar?.default?.collapse?.desktop?.enabled
  const toggleType = appSidebarDefaultCollapseDesktopEnabled
    ? 'collapse'
    : appSidebarDefaultMinimizeDesktopEnabled
    ? 'minimize'
    : ''
  const toggleState = appSidebarDefaultMinimizeDesktopEnabled ? 'active' : ''
  const appSidebarDefaultMinimizeDefault = config.app?.sidebar?.default?.minimize?.desktop?.default

  useEffect(() => {
    setTimeout(() => {
      const toggleObj = ToggleComponent.getInstance(toggleRef.current!) as ToggleComponent | null

      if (toggleObj === null) {
        return
      }

      // Add a class to prevent sidebar hover effect after toggle click
      toggleObj.on('kt.toggle.change', function () {
        // Set animation state
        props.sidebarRef.current!.classList.add('animating')

        // Wait till animation finishes
        setTimeout(function () {
          // Remove animation state
          props.sidebarRef.current!.classList.remove('animating')
        }, 300)
      })
    }, 600)
  }, [toggleRef, props.sidebarRef])

  return (
    <div
      className='app-sidebar-logo px-6'
      id='kt_app_sidebar_logo'
      style={{
        backgroundColor: atisaStyles.colors.dark,
        borderBottom: `2px solid ${atisaStyles.colors.secondary}`,
        padding: '20px 24px',
        marginBottom: '8px'
      }}
    >
      <Link
        to='/dashboard'
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            fontFamily: atisaStyles.fonts.primary,
            textAlign: 'center'
          }}>
            ATISA
          </div>
          <div style={{
            fontSize: '12px',
            color: atisaStyles.colors.light,
            fontFamily: atisaStyles.fonts.secondary,
            textAlign: 'center',
            letterSpacing: '1px'
          }}>
            GESTIÓN CALENDARIO / DOCUMENTAL
          </div>
        </div>
      </Link>

      {(appSidebarDefaultMinimizeDesktopEnabled || appSidebarDefaultCollapseDesktopEnabled) && (
        <div
          ref={toggleRef}
          id='kt_app_sidebar_toggle'
          className={clsx(
            'app-sidebar-toggle btn btn-icon btn-shadow btn-sm btn-color-muted btn-active-color-primary h-30px w-30px position-absolute top-50 start-100 translate-middle rotate',
            {active: appSidebarDefaultMinimizeDefault}
          )}
          style={{
            backgroundColor: atisaStyles.colors.secondary,
            border: `2px solid ${atisaStyles.colors.accent}`,
            color: 'white',
            boxShadow: '0 4px 12px rgba(0, 80, 92, 0.3)'
          }}
          data-kt-toggle='true'
          data-kt-toggle-state={toggleState}
          data-kt-toggle-target='body'
          data-kt-toggle-name={`app-sidebar-${toggleType}`}
        >
          <KTIcon iconName='black-left-line' className='fs-3 rotate-180 ms-1' />
        </div>
      )}
    </div>
  )
}

export {SidebarLogo}
