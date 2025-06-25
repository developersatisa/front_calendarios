import axios from './axiosConfig';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface CreateClientResponse {
  mensaje: string;
  api_key: string;
  cliente: string;
}

export const authService = {
  login: async (username: string, apiKey: string): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', apiKey);

    const response = await axios.post<LoginResponse>('/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  createClient: async (nombreCliente: string, adminKey: string): Promise<CreateClientResponse> => {
    const response = await axios.post<CreateClientResponse>(
      '/admin/api-clientes',
      { nombre_cliente: nombreCliente },
      {
        headers: {
          'x-admin-key': adminKey,
        },
      }
    );
    return response.data;
  }
};
