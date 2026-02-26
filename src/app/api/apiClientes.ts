import api from './axiosConfig'

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ApiCliente {
    id: number
    email: string
    activo: number
    created_at?: string
    updated_at?: string
}

// ─── API Functions ───────────────────────────────────────────────────────────

export const getAllApiClientes = async () => {
    const response = await api.get<ApiCliente[]>('/api_clientes')
    return response.data
}

export const createApiCliente = async (email: string) => {
    const adminApiKey = import.meta.env.VITE_ADMIN_KEY
    if (!adminApiKey) {
        console.warn('ADMIN API KEY no encontrada. Asegúrate de tener VITE_ADMIN_KEY en tu archivo .env')
    }
    const response = await api.post(
        '/admin/api-clientes',
        { nombre_cliente: email },
        { headers: { 'X-Admin-API-Key': adminApiKey } }
    )
    return response.data
}

export const updateApiCliente = async (id: number, activo: number) => {
    const response = await api.put(`/api_clientes/${id}`, { activo })
    return response.data
}

export const deleteApiCliente = async (id: number) => {
    const response = await api.delete(`/api_clientes/${id}`)
    return response.data
}
