
import {KTIcon} from '../../../helpers'
import {atisaStyles} from '../../../../app/styles/atisaStyles'

const SidebarFooter = () => {
  return (
    <div
      className='app-sidebar-footer flex-column-auto pt-2 pb-6 px-6'
      id='kt_app_sidebar_footer'
      style={{
        backgroundColor: atisaStyles.colors.dark,
        borderTop: `2px solid ${atisaStyles.colors.secondary}`,
        marginTop: 'auto',
        padding: '16px 24px'
      }}
    >
      <div style={{
        textAlign: 'center',
        color: atisaStyles.colors.light,
        fontFamily: atisaStyles.fonts.secondary,
        fontSize: '12px',
        letterSpacing: '0.5px'
      }}>
        <div style={{
          marginBottom: '4px',
          fontWeight: '600'
        }}>
          © 2024 ATISA
        </div>
        <div style={{
          fontSize: '10px',
          opacity: 0.8
        }}>
          Sistema de Gestión Calendario / Documental
        </div>
      </div>
    </div>
  )
}

export {SidebarFooter}
