import {SidebarMenuItem} from './SidebarMenuItem'

const SidebarMenuMain = () => {
  return (
    <>
      <SidebarMenuItem
        to='/dashboard'
        icon='table'
        fontIcon='bi-table'
        title='Dashboard'
      />
      <SidebarMenuItem
        to='/clientes-documental-calendario'
        icon='calendar'
        fontIcon='bi-calendar'
        title='Gestor Documental/Calendario'
      />
    </>
  )
}

export const SidebarMenu = () => {
  return <SidebarMenuMain />
}
