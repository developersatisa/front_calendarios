import api from './axiosConfig'

export interface Proceso {
  id: number
  nombre: string
  descripcion: string | null
  frecuencia: number
  temporalidad: string
  fecha_inicio: string
  fecha_fin: string | null
}

export interface ProcesosResponse {
  procesos: Proceso[]
  total: number
}

export const getAllProcesos = async (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const response = await api.get(`/procesos?${params.toString()}`);
    return response.data;
}

export const createProceso = async (proceso: Omit<Proceso, 'id'>) => {
  const response = await api.post<Proceso>('/procesos', proceso);
  return response.data;
}

export const updateProceso = async (id: number, proceso: Omit<Proceso, 'id'>) => {
  const response = await api.put<Proceso>(`/procesos/${id}`, proceso);
  return response.data;
}

export const deleteProceso = async (id: number) => {
  const response = await api.delete(`/procesos/${id}`);
  return response.data;
}
