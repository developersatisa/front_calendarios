import {SidebarMenuItem} from './SidebarMenuItem'

const SidebarMenuMain = () => {
  return (
    <>
      <SidebarMenuItem
        to='/clientes-documental-calendario'
        icon='calendar'
        fontIcon='bi-calendar'
        title='Gestor Documental/Calendario'
      />
      <SidebarMenuItem
        to='/dashboard'
        icon='table'
        fontIcon='bi-table'
        title='Dashboard'
      />
      <SidebarMenuItem
        to='/metricas'
        icon='table'
        fontIcon='bi-graph-up'
        title='Dashboard de Métricas'
      />
    </>
  )
}

export const SidebarMenu = () => {
  return <SidebarMenuMain />
}
