/**
 * High level router.
 *
 * Note: It's recommended to compose related routes in internal router
 * components (e.g: `src/app/modules/Auth/pages/AuthPage`, `src/app/BasePage`).
 */

import { FC } from 'react'
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom'
import { PrivateRoutes } from './PrivateRoutes'
import { ErrorsPage } from '../modules/errors/ErrorsPage'
import { Logout } from '../modules/auth'
import { AuthPage } from '../modules/auth/AuthPage'
import { SSOCallback } from '../modules/auth/SSOCallback'
import { Login } from '../components/Login'
import { App } from '../App'
import { useAuth } from '../modules/auth/core/Auth'

const { BASE_URL } = import.meta.env

const AppRoutes: FC = () => {
  const { auth } = useAuth()
  const isAuthenticated = !!auth?.api_token

  return (
    //<BrowserRouter basename={BASE_URL}>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route path='error/*' element={<ErrorsPage />} />
          <Route path='logout' element={<Logout />} />
          {isAuthenticated ? (
            <>
              <Route path='/*' element={<PrivateRoutes />} />
              <Route index element={<Navigate to='/clientes-documental-calendario' />} />
            </>
          ) : (
            <>
              <Route path='auth/*' element={<AuthPage />} />
              <Route path='sso/callback' element={<SSOCallback />} />
              <Route path='login' element={<Login />} />
              <Route path='*' element={<Navigate to='/login' />} />
            </>
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export { AppRoutes }
