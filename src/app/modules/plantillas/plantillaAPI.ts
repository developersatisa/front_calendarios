import axios from '../../api/axiosConfig' // usa el que acabas de configurar
//import axios from 'axios'

const API_URL = 'http://10.150.22.15:8092/plantillas'

export const getPlantillas = async () => axios.get(API_URL)
export const getPlantilla = async (id: number) => axios.get(`${API_URL}/${id}`)
export const createPlantilla = async (data: any) => axios.post(API_URL, data)
export const updatePlantilla = async (id: number, data: any) => axios.put(`${API_URL}/${id}`, data)
export const deletePlantilla = async (id: number) => axios.delete(`${API_URL}/${id}`)
