import { apiClient } from './client';

interface Usuario { id: number; nombre: string; email: string; rol: 'cliente' | 'admin' | 'diseniador'; whatsapp?: string; avatar?: string; createdAt?: string; }
interface Servicio { id: number; uuid?: string; slug: string; nombre: string; descripcion: string; icono: string; precioBase: number; unidad: string; pasos?: number; activo?: boolean; }
interface Diseno { id: number; uuid?: string; servicioId: number; nombre: string; descripcion?: string; imagen?: string; ancho?: number; alto?: number; unidad?: string; dimensiones?: { ancho: number; alto: number; unidad: string }; parametros?: Record<string, unknown>; }
interface Material { id: number; uuid?: string; servicioId: number; nombre: string; descripcion?: string; tipo: string; precioUnitario: number; stock: number; disponible?: boolean; activo?: boolean; }
interface Archivo { id: number; uuid?: string; usuarioId: number; nombre: string; url: string; formato: string; tamaño: number; fechaSubida?: string; }
interface Categoria { id: number; nombre: string; icono?: string; servicioId?: number; activo?: boolean; }
interface Armazon { id: number; uuid?: string; nombre: string; mecanismo: 'automatico' | 'madera' | 'bolsillo'; forma: 'circular' | 'rectangular' | 'cuadrada'; dimensionesMax?: string; precio: number; stock: number; }
interface Pedido { id: number; uuid?: string; usuarioId: number; servicioId: number; fase: string; estadoProduccion: string; total: number; fechaCreacion: string; }
interface Notificacion { id: number; usuarioId: number; titulo: string; mensaje: string; tipo: string; leido: boolean; createdAt: string; }
interface Mensaje { id: number; pedidoId: number; usuarioId: number; contenido: string; createdAt: string; }
interface PedidoStats { totalPedidos: number; ingresosTotales: number; }
interface ApiResponse<T> { success: boolean; data?: T; mensaje?: string; }
interface AuthResponse { success: boolean; token: string; usuario: Usuario; mensaje?: string; }

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }),

  register: (nombre: string, email: string, password: string, whatsapp?: string) =>
    apiClient.post<AuthResponse>('/auth/register', { nombre, email, password, whatsapp }),

  me: () => apiClient.get<ApiResponse<Usuario>>('/auth/me'),

  logout: () => apiClient.post<ApiResponse<void>>('/auth/logout'),

  refreshToken: () => apiClient.post<{ token: string }>('/auth/refresh'),
};

export const serviciosApi = {
  getAll: (params?: { activo?: boolean }) =>
    apiClient.get<ApiResponse<Servicio[]>>('/servicios', params),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Servicio>>(`/servicios/${id}`),

  getBySlug: (slug: string) =>
    apiClient.get<ApiResponse<Servicio>>(`/servicios/slug/${slug}`),

  crear: (servicio: Partial<Servicio>) =>
    apiClient.post<ApiResponse<{ id: number }>>('/servicios', servicio),

  actualizar: (id: number, servicio: Partial<Servicio>) =>
    apiClient.put<ApiResponse<void>>(`/servicios/${id}`, servicio),

  eliminar: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/servicios/${id}`),
};

export const disenosApi = {
  getAll: (servicioId?: number) =>
    apiClient.get<ApiResponse<Diseno[]>>('/disenos', { servicio_id: servicioId }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Diseno>>(`/disenos/${id}`),

  crear: (diseno: Partial<Diseno>) =>
    apiClient.post<ApiResponse<{ id: number }>>('/disenos', diseno),

  actualizar: (id: number, diseno: Partial<Diseno>) =>
    apiClient.put<ApiResponse<void>>(`/disenos/${id}`, diseno),

  eliminar: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/disenos/${id}`),
};

export const materialesApi = {
  getAll: (servicioId?: number) =>
    apiClient.get<ApiResponse<Material[]>>('/materiales', { servicio_id: servicioId }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Material>>(`/materiales/${id}`),

  crear: (material: Partial<Material>) =>
    apiClient.post<ApiResponse<{ id: number }>>('/materiales', material),

  actualizar: (id: number, material: Partial<Material>) =>
    apiClient.put<ApiResponse<void>>(`/materiales/${id}`, material),

  eliminar: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/materiales/${id}`),
};

export const categoriasApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Categoria[]>>('/categorias'),

  crear: (categoria: Partial<Categoria>) =>
    apiClient.post<ApiResponse<{ id: number }>>('/categorias', categoria),

  actualizar: (id: number, categoria: Partial<Categoria>) =>
    apiClient.put<ApiResponse<void>>(`/categorias/${id}`, categoria),

  eliminar: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/categorias/${id}`),
};

export const armazonesApi = {
  getAll: (mecanismo?: string) =>
    apiClient.get<ApiResponse<Armazon[]>>('/armazones', { mecanismo }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Armazon>>(`/armazones/${id}`),

  crear: (armazon: Partial<Armazon>) =>
    apiClient.post<ApiResponse<{ id: number }>>('/armazones', armazon),

  actualizar: (id: number, armazon: Partial<Armazon>) =>
    apiClient.put<ApiResponse<void>>(`/armazones/${id}`, armazon),

  eliminar: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/armazones/${id}`),
};

export const pedidosApi = {
  getMis: () =>
    apiClient.get<ApiResponse<Pedido[]>>('/pedidos/mis'),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Pedido>>(`/pedidos/${id}`),

  getMisByEstado: (estado: string) =>
    apiClient.get<ApiResponse<Pedido[]>>('/pedidos/mis', { estado }),

  adminGetAll: (params?: { estado?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<{ pedidos: Pedido[]; total: number }>>('/pedidos/admin/todos', params),

  adminCambiarEstado: (id: number, estado: string, nota?: string) =>
    apiClient.put<ApiResponse<void>>(`/pedidos/admin/${id}/estado`, { estado, nota }),
};

export const wizardApi = {
  getServicios: () =>
    apiClient.get<ApiResponse<Servicio[]>>('/wizard/servicios'),

  getServicio: (slug: string) =>
    apiClient.get<ApiResponse<Servicio>>(`/wizard/servicio/${slug}`),

  getDisenos: (servicioId: number) =>
    apiClient.get<ApiResponse<Diseno[]>>(`/wizard/${servicioId}/disenos`),

  getMateriales: (servicioId: number) =>
    apiClient.get<ApiResponse<Material[]>>(`/wizard/${servicioId}/materiales`),

  getArmazones: (mecanismo?: string) =>
    apiClient.get<ApiResponse<Armazon[]>>('/wizard/sellos/armazones', { mecanismo }),

  crearPedido: (servicioSlug: string, diseno: any, config: any) =>
    apiClient.post<ApiResponse<Pedido>>('/wizard/pedido', { servicioSlug, diseno, config }),

  getPedidos: () =>
    apiClient.get<ApiResponse<Pedido[]>>('/wizard/pedidos/mis'),

  getPedido: (id: number) =>
    apiClient.get<ApiResponse<Pedido>>(`/wizard/pedido/${id}`),

  actualizarFase: (id: number, fase: string, diseno?: any, config?: any, total?: number) =>
    apiClient.put<ApiResponse<void>>(`/wizard/pedido/${id}`, { fase, diseno, config, total }),
};

export const archivosApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Archivo[]>>('/archivos'),

  getByPedido: (pedidoId: number) =>
    apiClient.get<ApiResponse<Archivo[]>>(`/archivos/pedido/${pedidoId}`),

  subir: (file: File, pedidoId?: number) =>
    apiClient.uploadFile<ApiResponse<Archivo>>('/archivos', file, { pedido_id: pedidoId?.toString() }),

  eliminar: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/archivos/${id}`),
};

export const notificacionesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Notificacion[]>>('/notificaciones'),

  getSinLeer: () =>
    apiClient.get<ApiResponse<{ count: number }>>('/notificaciones/sin-leer'),

  marcarLeida: (id: number) =>
    apiClient.put<ApiResponse<void>>(`/notificaciones/${id}/leer`),

  marcarTodasLeidas: () =>
    apiClient.put<ApiResponse<void>>('/notificaciones/leer-todas'),
};

export const mensajesApi = {
  getByPedido: (pedidoId: number) =>
    apiClient.get<ApiResponse<Mensaje[]>>(`/mensajes/${pedidoId}/mensajes`),

  enviar: (pedidoId: number, contenido: string) =>
    apiClient.post<ApiResponse<{ id: number }>>(`/mensajes/${pedidoId}/mensajes`, { contenido }),

  marcarLeido: (mensajeId: number) =>
    apiClient.put<ApiResponse<void>>(`/mensajes/${mensajeId}/leer`),
};

export const contactoApi = {
  getHistorial: (pedidoId: number) =>
    apiClient.get<ApiResponse<{ historial: any[] }>>(`/contacto/${pedidoId}/historial`),

  enviarWhatsApp: (pedidoId: number, mensaje: string) =>
    apiClient.post<ApiResponse<{ link: string; whatsapp: string }>>(`/contacto/${pedidoId}/whatsapp`, { mensaje }),
};

export const adminApi = {
  getStats: () =>
    apiClient.get<ApiResponse<PedidoStats>>('/admin/pedidos/stats'),

  getPedidos: (params?: { estado?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<{ pedidos: Pedido[]; total: number }>>('/admin/pedidos', params),

  getUsuarios: () =>
    apiClient.get<ApiResponse<Usuario[]>>('/admin/usuarios'),

  crearUsuario: (usuario: Partial<Usuario> & { password: string }) =>
    apiClient.post<ApiResponse<{ id: number }>>('/admin/usuarios', usuario),

  actualizarUsuario: (id: number, usuario: Partial<Usuario>) =>
    apiClient.put<ApiResponse<void>>(`/admin/usuarios/${id}`, usuario),

  eliminarUsuario: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/usuarios/${id}`),

  exportarPedidos: async (formato: 'csv' | 'excel', filtros?: any) => {
    const params = { ...filtros, formato };
    return apiClient.get<Blob>(`/admin/pedidos/exportar/${formato}`, params);
  },
};

export default {
  auth: authApi,
  servicios: serviciosApi,
  disenos: disenosApi,
  materiales: materialesApi,
  categorias: categoriasApi,
  armazones: armazonesApi,
  pedidos: pedidosApi,
  wizard: wizardApi,
  archivos: archivosApi,
  notificaciones: notificacionesApi,
  mensajes: mensajesApi,
  contacto: contactoApi,
  admin: adminApi,
};