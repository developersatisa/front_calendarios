import { Route, Routes } from 'react-router-dom'
import { ForgotPassword } from './components/ForgotPassword'
import { Login } from '../../components/Login'
import { SSOCallback } from './SSOCallback'
import { AuthLayout } from './AuthLayout'

const AuthPage = () => (
  <Routes>
    <Route path='login' element={<Login />} />
    <Route element={<AuthLayout />}>
      <Route path='forgot-password' element={<ForgotPassword />} />
      <Route path='callback' element={<SSOCallback />} />
      <Route index element={<Login />} />
    </Route>
  </Routes>
)

export { AuthPage }
