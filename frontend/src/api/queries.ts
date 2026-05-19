import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { request, setAuthToken, setRefreshToken, clearAuth, getToken, ApiResponse } from './clienteAxios';
import { serviciosDemo, disenosDemo, materialesDemo } from './demoData';

/** SQLite devuelve activo como 0/1; normalizar a boolean para la UI */
export function withActivoBoolean<T extends { activo?: boolean | number }>(items: T[]): T[] {
  return items.map((item) => ({
    ...item,
    activo: item.activo === true || item.activo === 1,
  }));
}

type ListQueryOptions = {
  enabled?: boolean;
  staleTime?: number;
  /** Incluye registros inactivos (panel de administración) */
  includeInactive?: boolean;
};

// Query Keys
export const queryKeys = {
  servicios: ['servicios'] as const,
  servicio: (id: number) => ['servicios', id] as const,
  disenos: (servicioId?: number, scope: 'activos' | 'todos' = 'activos') =>
    ['disenos', servicioId, scope] as const,
  materiales: (servicioId?: number, scope: 'activos' | 'todos' = 'activos') =>
    ['materiales', servicioId, scope] as const,
  pedidos: ['pedidos'] as const,
  misPedidos: ['pedidos', 'mis'] as const,
  archivos: ['archivos'] as const,
  adminStats: ['admin', 'stats'] as const,
  categorias: ['categorias'] as const,
  armazones: ['armazones'] as const,
} as const;

// Hooks de Servicios
export function useServicios(options?: { enabled?: boolean; staleTime?: number }) {
  return useQuery({
    queryKey: queryKeys.servicios,
    queryFn: async () => {
      try {
        const res = await api.get('/servicios?activo=1');
        const responseData = res.data;
        const items = responseData?.data || [];
        return { success: responseData?.success, servicios: items, meta: responseData?.meta };
      } catch (err) {
        console.warn('Error fetching servicios, usando demo:', err);
        return { success: true, servicios: serviciosDemo };
      }
    },
    staleTime: 30 * 1000,
    enabled: options?.enabled !== false,
  });
}

export function useTodosServicios(options?: ListQueryOptions) {
  return useQuery({
    queryKey: [...queryKeys.servicios, 'todos'],
    queryFn: async () => {
      try {
        const res = await api.get('/servicios?todos=true');
        const responseData = res.data;
        const items = withActivoBoolean(responseData?.data || []);
        return { success: responseData?.success, servicios: items, meta: responseData?.meta };
      } catch (err) {
        console.warn('Error fetching servicios (todos), usando demo:', err);
        return { success: true, servicios: serviciosDemo };
      }
    },
    staleTime: 30 * 1000,
    enabled: options?.enabled !== false,
  });
}

// Hooks de Productos
export function useProductos(options?: { enabled?: boolean; staleTime?: number }) {
  return useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      try {
        const res = await api.get('/productos');
        const responseData = res.data;
        const items = responseData?.data || [];
        return { success: responseData?.success, productos: items };
      } catch (err) {
        console.warn('Error fetching productos, usando array vacío:', err);
        return { success: true, productos: [] };
      }
    },
    staleTime: 30 * 1000,
    enabled: options?.enabled !== false,
  });
}

export function useCategoriasProductos(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['productos', 'categorias'],
    queryFn: async () => {
      try {
        const res = await api.get('/productos/categorias');
        const responseData = res.data;
        return { success: responseData?.success, categorias: responseData?.data || [] };
      } catch (err) {
        console.warn('Error fetching categorias:', err);
        return { success: true, categorias: [] };
      }
    },
    enabled: options?.enabled !== false,
  });
}

export function useTodosProductos(options?: ListQueryOptions) {
  return useQuery({
    queryKey: ['productos', 'todos'],
    queryFn: async () => {
      try {
        const res = await api.get('/productos/todos');
        const responseData = res.data;
        const items = withActivoBoolean(responseData?.data || []);
        return { success: responseData?.success, productos: items };
      } catch (err) {
        console.warn('Error fetching productos (todos), usando array vacío:', err);
        return { success: true, productos: [] };
      }
    },
    staleTime: 30 * 1000,
    enabled: options?.enabled !== false,
  });
}

export function useServicio(id: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.servicio(id),
    queryFn: async () => {
      const res = await request<{ success: boolean; data?: any; servicio?: any }>(`/servicios/${id}`);
      const item = res.data || res.servicio;
      return { success: res.success, servicio: item };
    },
    enabled: !!id && (options?.enabled !== false),
  });
}

// Hooks de Disenos
export function useDisenos(servicioId?: number, options?: ListQueryOptions) {
  const scope = options?.includeInactive ? 'todos' : 'activos';
  return useQuery({
    queryKey: queryKeys.disenos(servicioId, scope),
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (servicioId) params.set('servicio_id', String(servicioId));
        if (options?.includeInactive) params.set('todos', 'true');
        const qs = params.toString();
        const res = await api.get(`/disenos${qs ? `?${qs}` : ''}`);
        const responseData = res.data;
        const items = withActivoBoolean(responseData?.data || []);
        return { success: responseData?.success, disenos: items };
      } catch (err) {
        console.warn('Error fetching disenos, usando demo:', err);
        return { success: true, disenos: disenosDemo };
      }
    },
    staleTime: 30 * 1000,
    enabled: options?.enabled !== false,
  });
}

// Hooks de Materiales
export function useMateriales(servicioId?: number, options?: ListQueryOptions) {
  const scope = options?.includeInactive ? 'todos' : 'activos';
  return useQuery({
    queryKey: queryKeys.materiales(servicioId, scope),
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (servicioId) params.set('servicio_id', String(servicioId));
        if (options?.includeInactive) params.set('todos', 'true');
        const qs = params.toString();
        const res = await api.get(`/materiales${qs ? `?${qs}` : ''}`);
        const responseData = res.data;
        const items = withActivoBoolean(responseData?.data || []);
        return { success: responseData?.success, materiales: items };
      } catch (err) {
        console.warn('Error fetching materiales, usando demo:', err);
        return { success: true, materiales: materialesDemo };
      }
    },
    staleTime: 30 * 1000,
    enabled: options?.enabled !== false,
  });
}

// Hooks de Pedidos
export function useMisPedidos(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.misPedidos,
    queryFn: async () => {
      const res = await request<{ success: boolean; data?: any[]; pedidos?: any[] }>('/pedidos/mis');
      const items = res.data || res.pedidos || [];
      return { success: res.success, pedidos: items };
    },
    staleTime: 30 * 1000,
    enabled: options?.enabled !== false,
  });
}

export function usePedido(id: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['pedidos', id] as const,
    queryFn: async () => {
      const res = await request<{ success: boolean; data?: any; pedido?: any }>(`/pedidos/${id}`);
      const item = res.data || res.pedido;
      return { success: res.success, pedido: item };
    },
    enabled: !!id && (options?.enabled !== false),
    staleTime: 30 * 1000,
  });
}

// Hook para obtener detalles del pedido desde admin
export function useAdminPedido(id: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin', 'pedidos', id] as const,
    queryFn: async () => {
      const res = await request<{ success: boolean; data?: any }>(`/pedidos/admin/${id}`);
      return res;
    },
    enabled: !!id && (options?.enabled !== false),
    staleTime: 30 * 1000,
  });
}

// Hooks de Archivos
export function useArchivos(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.archivos,
    queryFn: async () => {
      const res = await request<{ success: boolean; data?: any[]; archivos?: any[] }>('/archivos');
      const items = res.data || res.archivos || [];
      return { success: res.success, archivos: items };
    },
    staleTime: 60 * 1000,
    enabled: options?.enabled !== false,
  });
}

// Hooks Admin
export function useAdminStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: async () => {
      try {
        const res = await request('/admin/stats');
        return res;
      } catch (err) {
        console.warn('Error fetching admin stats:', err);
        return { success: true, resumen: { totalPedidos: 0, pedidosHoy: 0, ingresosMes: 0, ticketPromedio: 0, usuariosActivos: 0 } };
      }
    },
    staleTime: 60 * 1000,
    refetchInterval: 300 * 1000,
    enabled: options?.enabled !== false,
  });
}

// Dashboard stats con gráficos
export function useDashboardStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin', 'stats', 'dashboard'] as const,
    queryFn: async () => {
      try {
        const res = await request<{ 
          success: boolean; 
          stats: { totalPedidos: number; pedidosHoy: number; ingresosMes: number; ticketPromedio: number; usuariosActivos: number };
          pedidosPorMes: { mes: string; cantidad: number; ingresos: number }[];
          pedidosPorEstado: { estado: string; cantidad: number }[];
          topServicios: { nombre: string; icono: string; pedidos: number; revenue: number }[];
          pedidosRecientes: any[];
        }>('/admin/stats/dashboard');
        return res;
      } catch (err) {
        console.warn('Error fetching dashboard stats:', err);
        return { success: true, stats: { totalPedidos: 0, pedidosHoy: 0, ingresosMes: 0, ticketPromedio: 0, usuariosActivos: 0 }, pedidosPorMes: [], pedidosPorEstado: [], topServicios: [], pedidosRecientes: [] };
      }
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    enabled: options?.enabled !== false,
  });
}

// Mutations
export function useCreateMutation<T>(endpoint: string, queryKey: readonly unknown[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: T) => request(endpoint, { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateMutation<T>(endpoint: string, queryKey: readonly unknown[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: T) => request(endpoint, { method: 'PUT', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteMutation(endpoint: string, queryKey: readonly unknown[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => request(`${endpoint}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export { setAuthToken, setRefreshToken, clearAuth, getToken, api };
export type { ApiResponse };