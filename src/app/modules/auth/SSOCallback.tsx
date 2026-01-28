import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './core/Auth'
import { ssoCallback } from './core/_requests'

export function SSOCallback() {
    const navigate = useNavigate()
    const location = useLocation()
    const { saveAuth, setCurrentUser } = useAuth()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const code = params.get('code')

        if (code) {
            const processCallback = async () => {
                try {
                    const { data: incomingData } = await ssoCallback(code);
                    console.log('SSO Response Data:', incomingData);

                    const authData = {
                        ...incomingData,
                        api_token: incomingData.api_token || (incomingData as any).access_token || (incomingData as any).token,
                        refreshToken: incomingData.refreshToken || (incomingData as any).refresh_token,
                    };

                    if (authData.api_token) {
                        saveAuth(authData);

                        if (authData.user_info) {
                            setCurrentUser(authData.user_info);
                        }

                        navigate('/');
                    } else {
                        console.error('Missing api_token. Received keys:', Object.keys(incomingData));
                        setError(`No se recibió un token válido. Se encontraron: ${Object.keys(incomingData).join(', ')}`);
                    }
                } catch (e: any) {
                    console.error('Error during SSO callback:', e);
                    const errorMessage = e.response?.data?.detail || e.response?.data?.message || 'Error al verificar la identidad con el servidor.';
                    setError(errorMessage);
                }
            };
            processCallback();
        } else {
            const errorParam = params.get('error')
            const errorDescription = params.get('error_description')
            if (errorParam) {
                setError(`Error de autenticación: ${errorParam}${errorDescription ? ` - ${errorDescription}` : ''}`)
            } else {
                setError('No se recibió el código de autorización de Microsoft.')
            }
        }
    }, [location, saveAuth, setCurrentUser, navigate])

    if (error) {
        return (
            <div className='card card-custom'>
                <div className='card-body p-9'>
                    <div className='alert alert-danger'>
                        <div className='alert-text font-weight-bold'>{error}</div>
                    </div>
                    <div className='text-center'>
                        <button className='btn btn-primary' onClick={() => navigate('/auth/login')}>
                            Volver al Login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='d-flex flex-column flex-center shadow-sm p-10 bg-white rounded'>
            <div className='spinner-border text-primary' role='status'>
                <span className='visually-hidden'>Cargando...</span>
            </div>
            <div className='text-muted fw-bold fs-5 mt-5'>Procesando autenticación SSO...</div>
        </div>
    )
}
