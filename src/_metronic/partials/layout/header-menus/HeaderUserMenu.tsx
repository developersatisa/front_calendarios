
import {FC} from 'react'
import {useAuth} from '../../../../app/modules/auth'
import {toAbsoluteUrl} from '../../../helpers'
import { atisaStyles } from '../../../../app/styles/atisaStyles'

const HeaderUserMenu: FC = () => {
  const {currentUser, logout} = useAuth()
  return (
    <div
      className='menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg menu-state-primary fw-bold py-4 fs-6 w-275px'
      data-kt-menu='true'
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0, 80, 92, 0.15)',
        border: `1px solid ${atisaStyles.colors.light}`,
        fontFamily: atisaStyles.fonts.secondary,
        minWidth: '250px',
        zIndex: 9999
      }}
    >
      {/* Información del usuario */}
      <div className='menu-item px-3'>
        <div className='menu-content d-flex align-items-center px-3'>
          <div
            className='symbol symbol-50px me-4'
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              backgroundColor: atisaStyles.colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 80, 92, 0.2)'
            }}
          >
            <i
              className="bi bi-person-fill"
              style={{
                fontSize: '24px',
                color: 'white'
              }}
            ></i>
          </div>

          <div className='d-flex flex-column'>
            <div
              className='fw-bolder d-flex align-items-center fs-5'
              style={{
                fontFamily: atisaStyles.fonts.primary,
                color: atisaStyles.colors.primary,
                marginBottom: '4px'
              }}
            >
              {currentUser?.first_name || 'Usuario'}
              <span
                className='badge fw-bolder fs-8 px-2 py-1 ms-2'
                style={{
                  backgroundColor: atisaStyles.colors.secondary,
                  color: 'white',
                  borderRadius: '12px'
                }}
              >
                ATISA
              </span>
            </div>
            <div
              className='fw-bold text-muted fs-7'
              style={{
                color: atisaStyles.colors.dark,
                fontFamily: atisaStyles.fonts.secondary
              }}
            >
              {currentUser?.email || 'usuario@atisa.com'}
            </div>
          </div>
        </div>
      </div>

      <div
        className='separator my-2'
        style={{
          height: '1px',
          backgroundColor: atisaStyles.colors.light,
          margin: '8px 16px'
        }}
      ></div>

      {/* Opción de cerrar sesión */}
      <div className='menu-item px-3'>
        <a
          href='#'
          onClick={(e) => {
            e.preventDefault()
            logout()
          }}
          className='menu-link px-3 py-3 d-flex align-items-center'
          style={{
            color: '#dc3545',
            textDecoration: 'none',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            fontFamily: atisaStyles.fonts.secondary,
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8d7da'
            e.currentTarget.style.color = '#721c24'
            e.currentTarget.style.transform = 'translateX(4px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#dc3545'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          <i
            className="bi bi-box-arrow-right me-3"
            style={{ fontSize: '16px', color: '#dc3545' }}
          ></i>
          Cerrar Sesión
        </a>
      </div>
    </div>
  )
}

export {HeaderUserMenu}
