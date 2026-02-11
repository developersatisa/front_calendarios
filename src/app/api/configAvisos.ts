import api from './axiosConfig'

export interface ConfigAvisosPayload {
    cliente_id: string
    codSubDepar: string

    // Vence Hoy
    aviso_vence_hoy: boolean | number | null
    temporicidad_vence_hoy: number | null
    tiempo_vence_hoy: number | null
    hora_vence_hoy: string | null

    // Próximo Vencimiento
    aviso_proximo_vencimiento: boolean | number | null
    temporicidad_proximo_vencimiento: number | null
    tiempo_proximo_vencimiento: number | null
    hora_proximo_vencimiento: string | null
    dias_proximo_vencimiento: number | null

    // Vencido
    aviso_vencido: boolean | number | null
    temporicidad_vencido: number | null
    tiempo_vencido: number | null
    hora_vencido: string | null

    // Global
    config_global: boolean
    temporicidad_global: number | null
    tiempo_global: number | null
    hora_global: string | null
}

export const createConfigAvisos = async (payload: ConfigAvisosPayload) => {
    const response = await api.post(`/config-avisos-calendarios`, payload);
    return response.data
}

export const updateConfigAvisos = async (id: number | string, payload: ConfigAvisosPayload) => {
    const response = await api.put(`/config-avisos-calendarios/${id}`, payload);
    return response.data
}
