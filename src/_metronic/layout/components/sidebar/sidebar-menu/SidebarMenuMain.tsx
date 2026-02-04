/* eslint-disable react-refresh/only-export-components */
import { useIntl } from 'react-intl'
import { KTIcon } from '../../../../helpers'
import { SidebarMenuItemWithSub } from './SidebarMenuItemWithSub'
import { SidebarMenuItem } from './SidebarMenuItem'
import { useAuth } from '../../../../../app/modules/auth/core/Auth'

const SidebarMenuMain = () => {
  const intl = useIntl()
  const { isAdmin } = useAuth()

  return (
    <>
      {/* Dashboard - Solo para admins */}
      {isAdmin && (
        <SidebarMenuItem
          to='/dashboard'
          icon='element-11'
          title={intl.formatMessage({ id: 'MENU.DASHBOARD' })}
          fontIcon='bi-app-indicator'
        />
      )}

      {/* Módulos de gestión - Solo para admins */}
      {isAdmin && (
        <>
          <SidebarMenuItem to='/clientes' icon='briefcase' title='Clientes' fontIcon='bi-briefcase' />
          <SidebarMenuItem to='/procesos' icon='gear' title='Procesos' fontIcon='bi-gear' />
          <SidebarMenuItem to='/hitos' icon='flag' title='Hitos' fontIcon='bi-flag' />
          <SidebarMenuItem to='/plantillas' icon='file-text' title='Plantillas' fontIcon='bi-file-text' />
        </>
      )}

      {/* Módulos accesibles para todos (Usuarios y Admins) */}
      <SidebarMenuItem to='/clientes-documental-calendario' icon='calendar' title='Calendario Documental' fontIcon='bi-calendar' />
      <SidebarMenuItem to='/status-todos-clientes' icon='check-circle' title='Status Clientes' fontIcon='bi-check-circle' />
      <SidebarMenuItem to='/metricas' icon='graph-up' title='Métricas' fontIcon='bi-graph-up' />

      {/* Sección de Administración - Solo para admins */}
      {isAdmin && (
        <>
          <div className='menu-item'>
            <div className='menu-content pt-8 pb-2'>
              <span className='menu-section text-muted text-uppercase fs-8 ls-1'>Administración</span>
            </div>
          </div>
          <SidebarMenuItem
            to='/administracion'
            icon='shield-tick'
            title='Administradores'
            fontIcon='bi-shield-lock'
          />
        </>
      )}

      <div className='menu-item'>
        <div className='menu-content pt-8 pb-2'>
          <span className='menu-section text-muted text-uppercase fs-8 ls-1'>Apps</span>
        </div>
      </div>

      <SidebarMenuItemWithSub
        to='/apps/chat'
        title='Chat'
        fontIcon='bi-chat-left'
        icon='message-text-2'
      >
        <SidebarMenuItem to='/apps/chat/private-chat' title='Private Chat' hasBullet={true} />
        <SidebarMenuItem to='/apps/chat/group-chat' title='Group Chart' hasBullet={true} />
        <SidebarMenuItem to='/apps/chat/drawer-chat' title='Drawer Chart' hasBullet={true} />
      </SidebarMenuItemWithSub>
      <SidebarMenuItem
        to='/apps/user-management/users'
        icon='abstract-28'
        title='User management'
        fontIcon='bi-layers'
      />

    </>
  )
}

export { SidebarMenuMain }
