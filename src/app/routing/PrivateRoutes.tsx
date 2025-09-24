import {lazy, FC, Suspense} from 'react'
import {Route, Routes, Navigate, useParams} from 'react-router-dom'
import {MasterLayout} from '../../_metronic/layout/MasterLayout'
import TopBarProgress from 'react-topbar-progress-indicator'

import EntityDashboard from '../pages/dashboard/EntityDashboard'
import ClientesList from '../pages/dashboard/ClientesList'
import ProcesosList from '../pages/dashboard/ProcesosList'
import HitosList from '../pages/dashboard/HitosList'

import {MenuTestPage} from '../pages/MenuTestPage'
import {getCSSVariableValue} from '../../_metronic/assets/ts/_utils'
import {WithChildren} from '../../_metronic/helpers'
import BuilderPageWrapper from '../pages/layout-builder/BuilderPageWrapper'
import PlantillasList from '../pages/dashboard/PlantillasList'
import ClientesDocumentalCalendarioList from '../pages/cliente-documental/ClientesDocumentalCalendarioList'
import CalendarioCliente from '../pages/cliente-documental/components/calendario/CalendarioCliente'
import GestorDocumental from '../pages/cliente-documental/components/gestor_documental/GestorDocumental'
import MetricasList from '../pages/dashboard-metricas/MetricasList'



const PrivateRoutes = () => {
  const ProfilePage = lazy(() => import('../modules/profile/ProfilePage'))
  const WizardsPage = lazy(() => import('../modules/wizards/WizardsPage'))
  const AccountPage = lazy(() => import('../modules/accounts/AccountPage'))
  const WidgetsPage = lazy(() => import('../modules/widgets/WidgetsPage'))
  const ChatPage = lazy(() => import('../modules/apps/chat/ChatPage'))
  const UsersPage = lazy(() => import('../modules/apps/user-management/UsersPage'))

  return (
    <Routes>
      <Route element={<MasterLayout />}>
        {/* Redirect to Dashboard after success login/registartion */}
        <Route path='auth/*' element={<Navigate to='/dashboard' />} />
        {/* Pages */}
        <Route path='dashboard' element={<EntityDashboard />} />
        <Route path='builder' element={<BuilderPageWrapper />} />
        <Route path='menu-test' element={<MenuTestPage />} />
        <Route path='clientes' element={<ClientesList />} />
        <Route path='procesos' element={<ProcesosList />} />
        <Route path='hitos' element={<HitosList />} />
        <Route path='plantillas' element={<PlantillasList />} />
        <Route path='clientes-documental-calendario' element={<ClientesDocumentalCalendarioList />} />
        <Route path='/cliente-calendario/:clienteId' element={<CalendarioClienteWrapper />} />
        <Route path='gestor-documental/:clienteId' element={<GestorDocumentalWrapper />} />
        {/* <Route path='metadatos' element={<MetadatosList />} /> */}
        <Route path='metricas' element={<MetricasList />} />
        {/* Lazy Modules */}
        <Route
          path='crafted/pages/profile/*'
          element={
            <SuspensedView>
              <ProfilePage />
            </SuspensedView>
          }
        />
        <Route
          path='crafted/pages/wizards/*'
          element={
            <SuspensedView>
              <WizardsPage />
            </SuspensedView>
          }
        />
        <Route
          path='crafted/widgets/*'
          element={
            <SuspensedView>
              <WidgetsPage />
            </SuspensedView>
          }
        />
        <Route
          path='crafted/account/*'
          element={
            <SuspensedView>
              <AccountPage />
            </SuspensedView>
          }
        />
        <Route
          path='apps/chat/*'
          element={
            <SuspensedView>
              <ChatPage />
            </SuspensedView>
          }
        />
        <Route
          path='apps/user-management/*'
          element={
            <SuspensedView>
              <UsersPage />
            </SuspensedView>
          }
        />
        {/* Page Not Found */}
        <Route path='*' element={<Navigate to='/error/404' />} />
      </Route>
    </Routes>
  )
}

const SuspensedView: FC<WithChildren> = ({children}) => {
  const baseColor = getCSSVariableValue('--bs-primary')
  TopBarProgress.config({
    barColors: {
      '0': baseColor,
    },
    barThickness: 1,
    shadowBlur: 5,
  })
  return <Suspense fallback={<TopBarProgress />}>{children}</Suspense>
}

// Componente wrapper para extraer el clienteId de la URL y pasarlo como prop
const CalendarioClienteWrapper: FC = () => {
  const { clienteId } = useParams<{ clienteId: string }>()
  if (!clienteId) return null
  return <CalendarioCliente clienteId={clienteId} />
}

// Componente wrapper para extraer el clienteId de la URL y pasarlo como prop al Gestor Documental
const GestorDocumentalWrapper: FC = () => {
  const { clienteId } = useParams<{ clienteId: string }>()
  if (!clienteId) return null
  return <GestorDocumental clienteId={clienteId} />
}

export {PrivateRoutes}
