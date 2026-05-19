const API_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function setToken(token: string) {
  localStorage.setItem('token', token);
}

function removeToken() {
  localStorage.removeItem('token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.mensaje || 'Error del servidor');
  }

  return data;
}

// Auth
export const auth = {
  register: (nombre: string, email: string, password: string, whatsapp?: string) =>
    request<{ success: boolean; token: string; usuario: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre, email, password, whatsapp }),
    }).then(data => {
      if (data.token) setToken(data.token);
      return data;
    }),

  login: (email: string, password: string) =>
    request<{ success: boolean; token: string; usuario: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then(data => {
      if (data.token) setToken(data.token);
      return data;
    }),

  me: () => request<{ success: boolean; usuario: any }>('/auth/me'),

  logout: () => removeToken(),
};

// Servicios
export const servicios = {
  getAll: () => request<{ success: boolean; servicios: any[] }>('/servicios'),
  getById: (id: number) => request<{ success: boolean; servicio: any }>(`/servicios/${id}`),
  crear: (servicio: { nombre: string; slug: string; descripcion?: string; icono?: string; precioBase?: number; unidad?: string }) =>
    request<{ success: boolean; id: number }>('/servicios', {
      method: 'POST',
      body: JSON.stringify(servicio),
    }),
  actualizar: (id: number, servicio: { nombre: string; slug: string; descripcion?: string; icono?: string; precioBase?: number; unidad?: string; activo?: boolean }) =>
    request<{ success: boolean }>(`/servicios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(servicio),
    }),
  eliminar: (id: number) =>
    request<{ success: boolean }>(`/servicios/${id}`, {
      method: 'DELETE',
    }),
};

// Diseños
export const disenos = {
  getAll: (servicioId?: number) => {
    const query = servicioId ? `?servicio_id=${servicioId}` : '';
    return request<{ success: boolean; disenos: any[] }>(`/disenos${query}`);
  },
  getById: (id: number) => request<{ success: boolean; diseno: any }>(`/disenos/${id}`),
  crear: (diseno: { servicioId: number; nombre: string; imagen?: string; ancho: number; alto: number; unidad?: string; parametros?: any }) =>
    request<{ success: boolean; id: number }>('/disenos', {
      method: 'POST',
      body: JSON.stringify(diseno),
    }),
  actualizar: (id: number, diseno: { nombre?: string; imagen?: string; ancho?: number; alto?: number; unidad?: string; parametros?: any; activo?: boolean }) =>
    request<{ success: boolean }>(`/disenos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(diseno),
    }),
  eliminar: (id: number) =>
    request<{ success: boolean }>(`/disenos/${id}`, {
      method: 'DELETE',
    }),
};

// Materiales
export const materiales = {
  getAll: (servicioId?: number) => {
    const query = servicioId ? `?servicio_id=${servicioId}` : '';
    return request<{ success: boolean; materiales: any[] }>(`/materiales${query}`);
  },
  getById: (id: number) => request<{ success: boolean; material: any }>(`/materiales/${id}`),
  crear: (material: { servicioId: number; nombre: string; tipo: string; precioUnitario: number; stock: number }) =>
    request<{ success: boolean; id: number }>('/materiales', {
      method: 'POST',
      body: JSON.stringify(material),
    }),
  actualizar: (id: number, material: { nombre?: string; tipo?: string; precioUnitario?: number; stock?: number; activo?: boolean }) =>
    request<{ success: boolean }>(`/materiales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(material),
    }),
  eliminar: (id: number) =>
    request<{ success: boolean }>(`/materiales/${id}`, {
      method: 'DELETE',
    }),
};

// Categorías
export const categorias = {
  getAll: (servicioId?: number) => {
    const query = servicioId ? `?servicio_id=${servicioId}` : '';
    return request<{ success: boolean; categorias: any[] }>(`/categorias${query}`);
  },
  getById: (id: number) => request<{ success: boolean; categoria: any }>(`/categorias/${id}`),
  crear: (categoria: { servicioId?: number; nombre: string; icono?: string }) =>
    request<{ success: boolean; id: number }>('/categorias', {
      method: 'POST',
      body: JSON.stringify(categoria),
    }),
  actualizar: (id: number, categoria: { nombre?: string; icono?: string; activo?: boolean }) =>
    request<{ success: boolean }>(`/categorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoria),
    }),
  eliminar: (id: number) =>
    request<{ success: boolean }>(`/categorias/${id}`, {
      method: 'DELETE',
    }),
};

// Armazones
export const armazones = {
  getAll: (mecanismo?: string) => {
    const query = mecanismo ? `?mecanismo=${mecanismo}` : '';
    return request<{ success: boolean; armazones: any[] }>(`/armazones${query}`);
  },
  crear: (armazon: { nombre: string; mecanismo: string; forma?: string; dimensionesMax?: string; precio: number; stock: number }) =>
    request<{ success: boolean; id: number }>('/armazones', {
      method: 'POST',
      body: JSON.stringify(armazon),
    }),
  actualizar: (id: number, armazon: { nombre?: string; mecanismo?: string; forma?: string; dimensionesMax?: string; precio?: number; stock?: number; activo?: boolean }) =>
    request<{ success: boolean }>(`/armazones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(armazon),
    }),
  eliminar: (id: number) =>
    request<{ success: boolean }>(`/armazones/${id}`, {
      method: 'DELETE',
    }),
};

// Wizard
export const wizard = {
  getServicios: () => request<{ success: boolean; servicios: any[] }>('/wizard/servicios'),
  
  getServicio: (slug: string) => request<{ success: boolean; servicio: any }>(`/wizard/servicio/${slug}`),
  
  getDisenos: (servicioSlug: string) => {
    // Necesitamos primero obtener el ID del servicio
    return request<{ success: boolean; servicios: any[] }>('/wizard/servicios').then(res => {
      const servicio = res.servicios?.find((s: any) => s.slug === servicioSlug);
      if (!servicio) return { success: false, disenos: [] };
      return request<{ success: boolean; disenos: any[] }>(`/wizard/${servicio.id}/disenos`);
    });
  },
  
  getMateriales: (servicioSlug: string) => {
    return request<{ success: boolean; servicios: any[] }>('/wizard/servicios').then(res => {
      const servicio = res.servicios?.find((s: any) => s.slug === servicioSlug);
      if (!servicio) return { success: false, materiales: [] };
      return request<{ success: boolean; materiales: any[] }>(`/wizard/${servicio.id}/materiales`);
    });
  },
  
  getArmazones: (mecanismo?: string) => {
    const query = mecanismo ? `?mecanismo=${mecanismo}` : '';
    return request<{ success: boolean; armazones: any[] }>(`/wizard/sellos/armazones${query}`);
  },
  
  crearPedido: (servicioSlug: string, diseno: any, config: any) =>
    request<{ success: boolean; pedido: any }>('/wizard/pedido', {
      method: 'POST',
      body: JSON.stringify({ servicioSlug, diseno, config }),
    }),
  
  getPedidos: () => request<{ success: boolean; pedidos: any[] }>('/wizard/pedidos/mis'),
  
  getPedido: (id: number) => request<{ success: boolean; pedido: any }>(`/wizard/pedido/${id}`),
  
  actualizarFase: (id: number, fase: string, diseno?: any, config?: any, total?: number) =>
    request<{ success: boolean }>(`/wizard/pedido/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ fase, diseno, config, total }),
    }),
};

// Pedidos (Admin)
export const pedidos = {
  getMis: () => request<{ success: boolean; pedidos: any[] }>('/pedidos/mis'),
  getAdminTodos: (estado?: string) => {
    const query = estado ? `?estado=${estado}` : '?estado=todos';
    return request<{ success: boolean; pedidos: any[] }>(`/pedidos/admin/todos${query}`);
  },
  cambiarEstado: (id: number, estado: string, nota?: string) =>
    request<{ success: boolean }>(`/pedidos/admin/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado, nota }),
    }),
};

// Mensajes
export const mensajes = {
  getByPedido: (pedidoId: number) =>
    request<{ success: boolean; mensajes: any[] }>(`/mensajes/${pedidoId}/mensajes`),
  enviar: (pedidoId: number, contenido: string) =>
    request<{ success: boolean; id: number }>(`/mensajes/${pedidoId}/mensajes`, {
      method: 'POST',
      body: JSON.stringify({ contenido }),
    }),
  marcarLeido: (mensajeId: number) =>
    request<{ success: boolean }>(`/mensajes/${mensajeId}/leer`, {
      method: 'PUT',
    }),
};

// Notificaciones
export const notificaciones = {
  getAll: () => request<{ success: boolean; notificaciones: any[] }>('/notificaciones'),
  getSinLeer: () => request<{ success: boolean; count: number }>('/notificaciones/sin-leer'),
  marcarLeida: (id: number) =>
    request<{ success: boolean }>(`/notificaciones/${id}/leer`, {
      method: 'PUT',
    }).catch(() => ({ success: true })),
  marcarTodasLeidas: () =>
    request<{ success: boolean }>('/notificaciones/leer-todas', {
      method: 'PUT',
    }).catch(() => ({ success: true })),
};

// Contacto WhatsApp
export const contato = {
  getHistorial: (pedidoId: number) =>
    request<{ success: boolean; historial: any[] }>(`/contacto/${pedidoId}/historial`),
  enviarWhatsApp: (pedidoId: number, mensaje: string) =>
    request<{ success: boolean; link: string; whatsapp: string }>(`/contacto/${pedidoId}/whatsapp`, {
      method: 'POST',
      body: JSON.stringify({ mensaje }),
    }),
};

// Archivos
export const archivos = {
  getAll: () => request<{ success: boolean; archivos: any[] }>('/archivos'),
  getByPedido: (pedidoId: number) =>
    request<{ success: boolean; archivos: any[] }>(`/archivos/pedido/${pedidoId}`),
  subir: async (file: File): Promise<{ success: boolean; id: number; url: string; nombre: string }> => {
    const formData = new FormData();
    formData.append('archivo', file);
    
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}/archivos`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return res.json();
  },
};

// Admin - Diseños
export const adminDisenos = {
  getAll: (servicioId?: number) => {
    const query = servicioId ? `?servicio_id=${servicioId}` : '';
    return request<{ success: boolean; disenos: any[] }>(`/disenos${query}`);
  },
  crear: (diseno: { servicioId: number; nombre: string; ancho: number; alto: number; unidad: string }) =>
    request<{ success: boolean; id: number }>('/disenos', {
      method: 'POST',
      body: JSON.stringify(diseno),
    }),
  actualizar: (id: number, diseno: { nombre: string; ancho: number; alto: number; unidad: string }) =>
    request<{ success: boolean }>(`/disenos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(diseno),
    }),
  eliminar: (id: number) =>
    request<{ success: boolean }>(`/disenos/${id}`, {
      method: 'DELETE',
    }),
};

// Admin - Materiales
export const adminMateriales = {
  getAll: (servicioId?: number) => {
    const query = servicioId ? `?servicio_id=${servicioId}` : '';
    return request<{ success: boolean; materiales: any[] }>(`/materiales${query}`);
  },
  crear: (material: { servicioId: number; nombre: string; tipo: string; precioUnitario: number; stock: number }) =>
    request<{ success: boolean; id: number }>('/materiales', {
      method: 'POST',
      body: JSON.stringify(material),
    }),
  actualizar: (id: number, material: { nombre: string; tipo: string; precioUnitario: number; stock: number; activo: boolean }) =>
    request<{ success: boolean }>(`/materiales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(material),
    }),
  eliminar: (id: number) =>
    request<{ success: boolean }>(`/materiales/${id}`, {
      method: 'DELETE',
    }),
};

// Admin - Servicios
export const adminServicios = {
  getAll: () => request<{ success: boolean; servicios: any[] }>('/servicios'),
  crear: (servicio: { nombre: string; slug: string; descripcion?: string; icono?: string; precioBase?: number; unidad?: string }) =>
    request<{ success: boolean; id: number }>('/servicios', {
      method: 'POST',
      body: JSON.stringify(servicio),
    }),
  actualizar: (id: number, servicio: { nombre: string; slug: string; descripcion?: string; icono?: string; precioBase?: number; unidad?: string; activo?: boolean }) =>
    request<{ success: boolean }>(`/servicios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(servicio),
    }),
  eliminar: (id: number) =>
    request<{ success: boolean }>(`/servicios/${id}`, {
      method: 'DELETE',
    }),
};

// Admin - Armazones
export const adminArmazones = {
  getAll: () => request<{ success: boolean; armazones: any[] }>('/armazones'),
  crear: (armazon: { nombre: string; mecanismo: string; forma?: string; dimensionesMax?: string; precio: number; stock: number }) =>
    request<{ success: boolean; id: number }>('/armazones', {
      method: 'POST',
      body: JSON.stringify(armazon),
    }),
  actualizar: (id: number, armazon: { nombre: string; mecanismo: string; forma?: string; dimensionesMax?: string; precio: number; stock: number; activo?: boolean }) =>
    request<{ success: boolean }>(`/armazones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(armazon),
    }),
  eliminar: (id: number) =>
    request<{ success: boolean }>(`/armazones/${id}`, {
      method: 'DELETE',
    }),
};

export default {
  auth,
  servicios,
  disenos,
  materiales,
  categorias,
  armazones,
  wizard,
  pedidos,
  mensajes,
  notificaciones,
  contato,
  archivos,
  adminDisenos,
  adminMateriales,
  adminServicios,
  adminArmazones,
};
