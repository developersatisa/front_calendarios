import { SidebarMenuItem } from './SidebarMenuItem'
import { useAuth } from '../../../../../app/modules/auth/core/Auth'

const SidebarMenuMain = () => {
  const { isAdmin } = useAuth()

  return (
    <>
      <SidebarMenuItem
        to='/clientes-documental-calendario'
        icon='calendar'
        fontIcon='bi-calendar'
        title='Gestor Documental/Calendario'
      />

      <SidebarMenuItem
        to='/metricas'
        icon='table'
        fontIcon='bi-graph-up'
        title='Dashboard de Métricas'
      />

      {isAdmin && (
        <>
          <div className='menu-item'>
            <div className='menu-content pt-8 pb-2'>
              <span className='menu-section text-muted text-uppercase fs-8 ls-1'>Opciones administrador</span>
            </div>
          </div>
          <SidebarMenuItem
            to='/administracion'
            icon='table'
            fontIcon='bi-shield-lock'
            title='Roles y Usuarios'
          />
          <SidebarMenuItem
            to='/dashboard'
            icon='table'
            fontIcon='bi-table'
            title='Dashboard'
          />
          <SidebarMenuItem
            to='/config-avisos'
            icon='table'
            fontIcon='bi-table'
            title='Configuración de Avisos'
          />
        </>
      )}
    </>
  )
}

export const SidebarMenu = () => {
  return <SidebarMenuMain />
}
