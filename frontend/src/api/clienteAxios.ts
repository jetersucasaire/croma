import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { isSimulatedToken } from './authToken';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  mensaje?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  code?: string;
}

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let token = localStorage.getItem('token');
if (isSimulatedToken(token)) {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  token = null;
}

api.interceptors.request.use(
  (config) => {
    const currentToken = getToken();
    if (currentToken && !isSimulatedToken(currentToken)) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const currentToken = getToken();
      const refreshToken = localStorage.getItem('refreshToken');

      if (isSimulatedToken(currentToken) || !refreshToken) {
        const mensaje =
          (error.response?.data as { mensaje?: string })?.mensaje || 'Sesión no válida o expirada';
        return Promise.reject(new Error(mensaje));
      }

      originalRequest._retry = true;

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const newToken = response.data.token;
        if (!newToken) {
          throw new Error('Respuesta de refresh inválida');
        }
        setAuthToken(newToken);
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        clearAuth();
        return Promise.reject(
          new Error('Sesión expirada. Vuelve a iniciar sesión desde la pantalla principal.')
        );
      }
    }

    return Promise.reject(error);
  }
);

export function setAuthToken(newToken: string) {
  token = newToken;
  localStorage.setItem('token', newToken);
}

export function setRefreshToken(newToken: string) {
  localStorage.setItem('refreshToken', newToken);
}

export function clearAuth() {
  token = null;
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
}

export function getToken(): string | null {
  return token || localStorage.getItem('token');
}

export async function request<T = unknown>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
  try {
    const response = await api({ url: endpoint, ...options });
    const data = response.data as ApiResponse<T>;

    if (!data.success) {
      throw new Error(data.mensaje || 'Error del servidor');
    }

    return data.data as T;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const body = err.response.data as { mensaje?: string; message?: string };
      throw new Error(body.mensaje || body.message || err.message);
    }
    throw err;
  }
}

export default api;