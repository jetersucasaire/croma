import { create } from 'zustand';
import api, { setAuthToken, clearAuth as clearAxiosAuth, getToken } from '../api/clienteAxios';
import { isSimulatedToken } from '../api/authToken';
import { apiClient } from '../api/client';
import { DEV_USER_PASSWORDS } from '../config/devAuth';
import type { Usuario } from '../types';

interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  loginAs: (usuario: Usuario) => Promise<void>;
  register: (nombre: string, email: string, password: string, whatsapp?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setUsuario: (usuario: Usuario | null) => void;
}

function syncTokens(token: string | null) {
  if (token && !isSimulatedToken(token)) {
    setAuthToken(token);
    apiClient.setToken(token);
  } else {
    clearAxiosAuth();
    apiClient.removeToken();
  }
}

const initialToken = getToken();
if (isSimulatedToken(initialToken)) {
  clearAxiosAuth();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  usuario: null,
  token: initialToken && !isSimulatedToken(initialToken) ? initialToken : null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data as { success: boolean; token?: string; usuario?: Usuario; mensaje?: string };
      if (data.success && data.token && data.usuario) {
        syncTokens(data.token);
        set({
          usuario: data.usuario,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ error: data.mensaje || 'Error al iniciar sesión', isLoading: false });
        throw new Error(data.mensaje || 'Error al iniciar sesión');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error de conexión';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  loginAs: async (usuario: Usuario) => {
    const password = DEV_USER_PASSWORDS[usuario.email];
    if (!password) {
      const msg = `No hay contraseña de desarrollo para ${usuario.email}`;
      set({ error: msg });
      throw new Error(msg);
    }
    await get().login(usuario.email, password);
  },

  register: async (nombre: string, email: string, password: string, whatsapp?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { nombre, email, password, whatsapp });
      const data = response.data as { success: boolean; token?: string; usuario?: Usuario; mensaje?: string };
      if (data.success && data.token && data.usuario) {
        syncTokens(data.token);
        set({
          usuario: data.usuario,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ error: data.mensaje || 'Error al registrar', isLoading: false });
        throw new Error(data.mensaje || 'Error al registrar');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error de conexión';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    syncTokens(null);
    set({ usuario: null, token: null, isAuthenticated: false, error: null });
  },

  checkAuth: async () => {
    const token = getToken();
    if (!token || isSimulatedToken(token)) {
      syncTokens(null);
      set({ isAuthenticated: false, usuario: null, token: null });
      return;
    }
    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      const data = response.data as { success: boolean; data?: Usuario };
      if (data.success && data.data) {
        syncTokens(token);
        set({ usuario: data.data, token, isAuthenticated: true, isLoading: false });
      } else {
        syncTokens(null);
        set({ isAuthenticated: false, usuario: null, token: null, isLoading: false });
      }
    } catch {
      syncTokens(null);
      set({ isAuthenticated: false, usuario: null, token: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  setUsuario: (usuario) => set({ usuario }),
}));

export default useAuthStore;
