import { FC } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../modules/auth/core/Auth'

interface AdminRouteProps {
    children: React.ReactElement
}

const AdminRoute: FC<AdminRouteProps> = ({ children }) => {
    const { isAdmin } = useAuth()

    if (!isAdmin) {
        // Redirigir a una página accesible si no es admin
        return <Navigate to='/clientes-documental-calendario' replace />
    }

    return children
}

export default AdminRoute
