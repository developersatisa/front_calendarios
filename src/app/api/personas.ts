import api from './axiosConfig'

export interface Persona {
    NIF: string
    Nombre: string
    Apellido1: string
    Apellido2: string
    email: string
    admin: boolean | number
    id_api_rol: number | null
}

export interface PersonasResponse {
    total: number
    personas: Persona[]
}

export const getAllPersonas = async () => {
    const response = await api.get<PersonasResponse>('/personas')
    return response.data.personas || []
}
