import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config';
import { isSimulatedToken } from './authToken';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

class ApiClient {
  private client;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && !isSimulatedToken(token)) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (import.meta.env.DEV) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          const token = this.getToken();
          if (isSimulatedToken(token) || !localStorage.getItem('refreshToken')) {
            return Promise.reject(error);
          }
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const response = await axios.post(`${config.api.baseUrl}/auth/refresh`);
            const { token } = response.data;
            
            this.setToken(token);
            this.refreshSubscribers.forEach((callback) => callback(token));
            this.refreshSubscribers = [];

            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.removeToken();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        const apiError = this.formatError(error);
        return Promise.reject(apiError);
      }
    );
  }

  private formatError(error: AxiosError): ApiError {
    if (error.response) {
      const data = error.response.data as any;
      return {
        message: data?.mensaje || data?.message || error.message,
        status: error.response.status,
        code: data?.code,
      };
    }
    
    if (error.request) {
      return {
        message: 'Sin conexión al servidor. Verifica tu conexión a internet.',
        code: 'NETWORK_ERROR',
      };
    }
    
    return {
      message: error.message || 'Error desconocido',
      code: 'UNKNOWN',
    };
  }

  getToken(): string | null {
    return localStorage.getItem(config.storage.keys.authToken);
  }

  setToken(token: string): void {
    localStorage.setItem(config.storage.keys.authToken, token);
  }

  removeToken(): void {
    localStorage.removeItem(config.storage.keys.authToken);
  }

  async get<T>(url: string, params?: object): Promise<T> {
    const response = await this.client.get(url, { params });
    return response.data as T;
  }

  async post<T>(url: string, data?: object): Promise<T> {
    const response = await this.client.post(url, data);
    return response.data as T;
  }

  async put<T>(url: string, data?: object): Promise<T> {
    const response = await this.client.put(url, data);
    return response.data as T;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete(url);
    return response.data as T;
  }

  async uploadFile<T>(url: string, file: File, additionalData?: Record<string, string>): Promise<T> {
    const formData = new FormData();
    formData.append('archivo', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data as T;
  }
}

export const apiClient = new ApiClient();
export default apiClient;