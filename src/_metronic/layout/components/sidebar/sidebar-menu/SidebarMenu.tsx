import {SidebarMenuItem} from './SidebarMenuItem'

const SidebarMenuMain = () => {
  return (
    <>
      <SidebarMenuItem
        to='/dashboard'
        icon='/media/icons/duotune/general/gen025.svg'
        title='Dashboard'
        fontIcon='bi-app-indicator'
      />
    </>
  )
}

export const SidebarMenu = () => {
  return <SidebarMenuMain />
}
