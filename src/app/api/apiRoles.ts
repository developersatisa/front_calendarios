import api from './axiosConfig'

export interface ApiRole {
    id: number
    email: string
    admin: boolean | number // BIT in SQL can be number 0/1 or boolean depending on formatting
}

// Get the role of a user by email
export const getRoleByEmail = async (email: string) => {
    const response = await api.get<ApiRole>(`/api-rol?email=${email}`)
    return response.data
}

// Create a new role record (usually to grant admin)
export const createRole = async (email: string) => {
    const response = await api.post('/api-rol', {
        email: email
    })
    return response.data
}

// Update an existing role record by ID
export const updateRole = async (id: number, isAdmin: boolean) => {
    const response = await api.put(`/api-rol/${id}`, {
        admin: isAdmin ? 1 : 0
    })
    return response.data
}
