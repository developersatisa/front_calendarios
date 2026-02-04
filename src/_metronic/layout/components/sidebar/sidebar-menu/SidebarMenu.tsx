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

      {isAdmin && (
        <SidebarMenuItem
          to='/dashboard'
          icon='table'
          fontIcon='bi-table'
          title='Dashboard'
        />
      )}

      <SidebarMenuItem
        to='/metricas'
        icon='table'
        fontIcon='bi-graph-up'
        title='Dashboard de Métricas'
      />

      {isAdmin && (
        <SidebarMenuItem
          to='/administracion'
          icon='table'
          fontIcon='bi-shield-lock'
          title='Administración'
        />
      )}
    </>
  )
}

export const SidebarMenu = () => {
  return <SidebarMenuMain />
}
