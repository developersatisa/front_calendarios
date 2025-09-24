import {FC} from 'react'
import clsx from 'clsx'
import {Link} from 'react-router-dom'
import {useLocation} from 'react-router'
import {checkIsActive, KTIcon, WithChildren} from '../../../../helpers'
import {useLayout} from '../../../core'
import {atisaStyles} from '../../../../../app/styles/atisaStyles'

type Props = {
  to: string
  title: string
  icon?: string
  fontIcon?: string
  hasBullet?: boolean
}

const SidebarMenuItem: FC<Props & WithChildren> = ({
  children,
  to,
  title,
  icon,
  fontIcon,
  hasBullet = false,
}) => {
  const {pathname} = useLocation()
  const isActive = checkIsActive(pathname, to)
  const {config} = useLayout()
  const {app} = config

  return (
    <div
      className='menu-item'
      style={{
        margin: '4px 8px',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      <Link
        className={clsx('menu-link without-sub', {active: isActive})}
        to={to}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          textDecoration: 'none',
          color: isActive ? 'white' : atisaStyles.colors.light,
          backgroundColor: isActive ? atisaStyles.colors.secondary : 'transparent',
          borderRadius: '8px',
          fontFamily: atisaStyles.fonts.secondary,
          fontWeight: isActive ? '600' : '500',
          fontSize: '14px',
          transition: 'all 0.3s ease',
          border: isActive ? `2px solid ${atisaStyles.colors.accent}` : '2px solid transparent',
          boxShadow: isActive ? '0 4px 12px rgba(156, 186, 57, 0.3)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = atisaStyles.colors.dark
            e.currentTarget.style.color = 'white'
            e.currentTarget.style.transform = 'translateX(4px)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = atisaStyles.colors.light
            e.currentTarget.style.transform = 'translateX(0)'
          }
        }}
      >
        {hasBullet && (
          <span className='menu-bullet'>
            <span className='bullet bullet-dot'></span>
          </span>
        )}

        {/* Renderizado de iconos SVG */}
        {icon && app?.sidebar?.default?.menu?.iconType === 'svg' && (
          <span
            className='menu-icon'
            style={{
              marginRight: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            <KTIcon iconName={icon} className='fs-2' />
          </span>
        )}

        {/* Renderizado de iconos de fuente */}
        {fontIcon && app?.sidebar?.default?.menu?.iconType === 'font' && (
          <span
            className='menu-icon'
            style={{
              marginRight: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            <i className={clsx('bi fs-4', fontIcon)} style={{
              color: isActive ? 'white' : atisaStyles.colors.light
            }}></i>
          </span>
        )}

        {/* Si no hay configuración específica, usar font icons por defecto */}
        {fontIcon && !app?.sidebar?.default?.menu?.iconType && (
          <span
            className='menu-icon'
            style={{
              marginRight: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            <i className={clsx('bi fs-4', fontIcon)} style={{
              color: isActive ? 'white' : atisaStyles.colors.light
            }}></i>
          </span>
        )}

        <span
          className='menu-title'
          style={{
            fontFamily: atisaStyles.fonts.secondary,
            fontWeight: isActive ? '600' : '500',
            fontSize: '14px',
            letterSpacing: '0.5px'
          }}
        >
          {title}
        </span>
      </Link>
      {children}
    </div>
  )
}

export {SidebarMenuItem}
