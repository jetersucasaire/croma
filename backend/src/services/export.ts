import jsonexport from 'jsonexport';
import { parse as json2csv } from 'json2csv';
import { logger } from '../middleware/logger';

export type ExportFormat = 'csv' | 'json' | 'excel';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  columns?: string[];
}

export async function exportData<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  const { format, filename = 'export', columns } = options;

  const filteredData = columns?.length 
    ? data.map(row => columns.reduce((acc, col) => ({ ...acc, [col]: row[col] }), {} as T))
    : data;

  let buffer: Buffer;
  let contentType: string;
  let extension: string;

  switch (format) {
    case 'csv':
      buffer = Buffer.from(await json2csv(filteredData));
      contentType = 'text/csv';
      extension = 'csv';
      break;

    case 'excel':
      buffer = Buffer.from(await jsonexport(filteredData));
      contentType = 'application/vnd.ms-excel';
      extension = 'xls';
      break;

    case 'json':
    default:
      buffer = Buffer.from(JSON.stringify(filteredData, null, 2));
      contentType = 'application/json';
      extension = 'json';
      break;
  }

  logger.info({ format, rows: data.length, filename }, 'Data exported');

  return {
    buffer,
    filename: `${filename}_${Date.now()}.${extension}`,
    contentType,
  };
}

export async function exportPedidos(pedidos: any[], format: ExportFormat = 'csv'): Promise<Buffer> {
  const data = pedidos.map(p => ({
    ID: p.id,
    UUID: p.uuid,
    'Tracking ID': p.tracking_id,
    Servicio: p.servicioNombre,
    Cliente: p.usuarioNombre,
    Email: p.usuarioEmail,
    Fase: p.fase,
    Estado: p.estado_produccion,
    Total: p.total,
    'Fecha Creación': p.created_at,
    'Última Actualización': p.updated_at,
  }));

  const { buffer } = await exportData(data, { format, filename: 'pedidos' });
  return buffer;
}

export async function exportUsuarios(usuarios: any[], format: ExportFormat = 'csv'): Promise<Buffer> {
  const data = usuarios.map(u => ({
    ID: u.id,
    UUID: u.uuid,
    Nombre: u.nombre,
    Email: u.email,
    Rol: u.rol,
    WhatsApp: u.whatsapp,
    'Fecha Registro': u.created_at,
    Activo: u.activo,
  }));

  const { buffer } = await exportData(data, { format, filename: 'usuarios' });
  return buffer;
}

export async function exportServicios(servicios: any[], format?: ExportFormat): Promise<Buffer> {
  const data = servicios.map(s => ({
    ID: s.id,
    UUID: s.uuid,
    Nombre: s.nombre,
    Slug: s.slug,
    Descripción: s.descripcion,
    'Precio Base': s.precio_base,
    Unidad: s.unidad,
    Icono: s.icono,
    Activo: s.activo,
  }));

  const { buffer } = await exportData(data, { format: format || 'csv', filename: 'servicios' });
  return buffer;
}