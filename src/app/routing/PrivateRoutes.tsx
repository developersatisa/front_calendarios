import { lazy, FC, Suspense } from 'react'
import { Route, Routes, Navigate, useParams } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import TopBarProgress from 'react-topbar-progress-indicator'

import EntityDashboard from '../pages/dashboard/EntityDashboard'
import ClientesList from '../pages/dashboard/ClientesList'
import ProcesosList from '../pages/dashboard/ProcesosList'
import HitosList from '../pages/dashboard/HitosList'

import { MenuTestPage } from '../pages/MenuTestPage'
import { getCSSVariableValue } from '../../_metronic/assets/ts/_utils'
import { WithChildren } from '../../_metronic/helpers'
import BuilderPageWrapper from '../pages/layout-builder/BuilderPageWrapper'
import PlantillasList from '../pages/dashboard/PlantillasList'
import ClientesDocumentalCalendarioList from '../pages/cliente-documental/ClientesDocumentalCalendarioList'
import CalendarioCliente from '../pages/cliente-documental/components/calendario/CalendarioCliente'
import EdicionCalendarioCliente from '../pages/dashboard/edicion_calendarios/EdicionCalendarioCliente'
import GestorDocumental from '../pages/cliente-documental/components/gestor_documental/GestorDocumental'
import MetricasList from '../pages/dashboard-metricas/MetricasList'
import HistoricoCumplimientos from '../pages/cliente-documental/components/calendario/HistoricoCumplimientos'
import StatusCliente from '../pages/cliente-documental/components/calendario/StatusCliente'
import StatusTodosClientes from '../pages/cliente-documental/components/calendario/StatusTodosClientes'
import AdministradoresPage from '../pages/administracion/AdministradoresPage'
import ConfigAvisosPage from '../pages/config-avisos/ConfigAvisosPage'
import AdminRoute from './AdminRoute'
import CumplimientoMasivo from '../pages/cliente-documental/components/calendario/CumplimientoMasivo'
import HistorialAuditoria from '../pages/dashboard/edicion_calendarios/HistorialAuditoria'
import { HistorialAuditoriaGlobal } from '../pages/dashboard/components/HistorialAuditoriaGlobal'



import { useAuth } from '../modules/auth/core/Auth'
import MetadatosList from '../pages/dashboard/MetadatosList'

const PrivateRoutes = () => {
  const { isAdmin } = useAuth()
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
        <Route path='auth/*' element={<Navigate to={isAdmin ? '/dashboard' : '/clientes'} />} />
        {/* Pages */}
        {/* Dashboard - Solo para admins */}
        <Route path='dashboard' element={
          <AdminRoute>
            <EntityDashboard />
          </AdminRoute>
        } />
        <Route path='builder' element={<BuilderPageWrapper />} />
        <Route path='menu-test' element={<MenuTestPage />} />
        <Route path='clientes' element={<ClientesList />} />
        <Route path='procesos' element={<ProcesosList />} />
        <Route path='hitos' element={<HitosList />} />
        <Route path='plantillas' element={<PlantillasList />} />


        <Route path='clientes-documental-calendario' element={<ClientesDocumentalCalendarioList />} />
        <Route path='cumplimiento-masivo' element={<CumplimientoMasivo />} />
        <Route path='/cliente-calendario/:clienteId' element={<CalendarioClienteWrapper />} />
        <Route path='/edicion-calendario/:clienteId' element={<EdicionCalendarioClienteWrapper />} />
        <Route path='/historial-auditoria/:clienteId' element={<HistorialAuditoria />} />
        <Route path='/auditoria-general' element={<HistorialAuditoriaGlobal />} />
        <Route path='gestor-documental/:clienteId' element={<GestorDocumentalWrapper />} />
        <Route path='historico-cumplimientos/:clienteId' element={<HistoricoCumplimientosWrapper />} />
        <Route path='status-cliente/:clienteId' element={<StatusClienteWrapper />} />
        <Route path='status-todos-clientes' element={<StatusTodosClientes />} />
        <Route path='metadatos' element={<MetadatosList />} />
        <Route path='metricas' element={<MetricasList />} />
        <Route path='config-avisos' element={<ConfigAvisosPage />} />
        {/* Administración - Solo para admins */}
        <Route path='administracion' element={
          <AdminRoute>
            <AdministradoresPage />
          </AdminRoute>
        } />
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

const SuspensedView: FC<WithChildren> = ({ children }) => {
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

// Componente wrapper para extraer el clienteId de la URL y pasarlo como prop al Editar Calendario
const EdicionCalendarioClienteWrapper: FC = () => {
  const { clienteId } = useParams<{ clienteId: string }>()
  if (!clienteId) return null
  return <EdicionCalendarioCliente clienteId={clienteId} />
}

// Componente wrapper para extraer el clienteId de la URL y pasarlo como prop al Gestor Documental
const GestorDocumentalWrapper: FC = () => {
  const { clienteId } = useParams<{ clienteId: string }>()
  if (!clienteId) return null
  return <GestorDocumental clienteId={clienteId} />
}

// Componente wrapper para extraer el clienteId de la URL y pasarlo como prop al Histórico de Cumplimientos
const HistoricoCumplimientosWrapper: FC = () => {
  const { clienteId } = useParams<{ clienteId: string }>()
  if (!clienteId) return null
  return <HistoricoCumplimientos clienteId={clienteId} />
}

// Componente wrapper para extraer el clienteId de la URL y pasarlo como prop a Status Cliente
const StatusClienteWrapper: FC = () => {
  const { clienteId } = useParams<{ clienteId: string }>()
  if (!clienteId) return null
  return <StatusCliente clienteId={clienteId} />
}

export { PrivateRoutes }
