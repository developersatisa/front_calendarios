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
    </>
  )
}

export const SidebarMenu = () => {
  return <SidebarMenuMain />
}
