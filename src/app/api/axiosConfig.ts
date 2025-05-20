import axios from 'axios'

const instance = axios.create({
  baseURL: 'http://10.150.22.15:8092', // cambia esto si es otro host
  
  headers: {
    'x_api_key': 'clave_powerbi_123',
  }
})

export default instance
