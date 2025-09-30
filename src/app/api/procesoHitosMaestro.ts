import api from './axiosConfig'

export interface ProcesoHitos {
  id: number
  proceso_id: number
  hito_id: number
}

export interface ProcesoHitosMaestroResponse {
  ProcesoHitos: ProcesoHitos[]
  total: number
}

export const getAllProcesoHitosMaestro = async (page?: number, limit?: number) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const response = await api.get<{total: number, procesoHitos: ProcesoHitos[]}>(`/proceso-hitos?${params.toString()}`);

    // Transformar la respuesta al formato esperado
    return {
      ProcesoHitos: response.data.procesoHitos || [],
      total: response.data.total || 0
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      ProcesoHitos: [],
      total: 0
    };
  }
}

export const createProcesoHitosMaestro = async (procesoHito: Omit<ProcesoHitos, 'id'>) => {
  const response = await api.post<ProcesoHitos>('/proceso-hitos', procesoHito)
  return response.data
}

export const deleteProcesoHitosMaestro = async (id: number) => {
  return await api.delete(`/proceso-hitos/${id}`)
}
