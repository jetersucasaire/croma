import { z } from 'zod';

export const registerSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  whatsapp: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const servicioSchema = z.object({
  nombre: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  descripcion: z.string().max(500).optional(),
  icono: z.string().max(10).optional(),
  imagen: z.string().optional().or(z.string().startsWith('data:image')),
  precioBase: z.number().min(0).optional(),
  unidad: z.string().max(20).optional(),
  activo: z.boolean().optional(),
});

export const materialSchema = z.object({
  servicioId: z.number().int().positive().optional().nullable(),
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(500).optional().nullable(),
  tipo: z.string().max(50).optional(),
  precioUnitario: z.number().min(0).default(0),
  stock: z.number().int().min(0).default(0),
  activo: z.boolean().optional().default(true),
});

export const disenoSchema = z.object({
  servicioId: z.number().int().positive(),
  nombre: z.string().min(1).max(100),
  imagen: z.string().optional(),
  ancho: z.number().positive().optional(),
  alto: z.number().positive().optional(),
  unidad: z.string().max(10).optional().default('cm'),
  parametros: z.record(z.string(), z.any()).optional(),
  activo: z.boolean().optional().default(true),
});

export const armazonSchema = z.object({
  nombre: z.string().min(2).max(100),
  mecanismo: z.enum(['automatico', 'madera', 'bolsillo']),
  forma: z.string().max(50).optional(),
  dimensionesMax: z.record(z.string(), z.number()).optional(),
  precio: z.number().min(0),
  stock: z.number().int().min(0).default(0),
});

export const pedidoSchema = z.object({
  servicioId: z.number().int().positive(),
  diseno: z.object({
    disenoId: z.number().int().optional(),
    archivoUrl: z.string().url().optional(),
    archivoNombre: z.string().optional(),
    tipoCarga: z.enum(['catalogo', 'archivo', 'enlace']).default('catalogo'),
    enlaceExterno: z.string().url().optional(),
    parametros: z.record(z.string(), z.any()).optional(),
  }).optional(),
  configuracion: z.object({
    materialId: z.number().int().optional(),
    cantidad: z.number().int().positive().default(1),
    precioUnitario: z.number().min(0).default(0),
    opciones: z.record(z.string(), z.any()).optional(),
  }).optional(),
});

export const faseUpdateSchema = z.object({
  fase: z.enum(['diseno', 'configuracion', 'produccion', 'entrega', 'completado']),
  diseno: pedidoSchema.shape.diseno.optional(),
  configuracion: pedidoSchema.shape.configuracion.optional(),
  total: z.number().min(0).optional(),
});

export const mensajeSchema = z.object({
  contenido: z.string().min(1, 'Mensaje requerido').max(2000),
});

export const categoriaSchema = z.object({
  servicioId: z.number().int().positive().optional(),
  nombre: z.string().min(2).max(100),
  icono: z.string().max(10).optional(),
});

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): { success: true; data: T } | { success: false; error: string } => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const issues = result.error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`);
      return { success: false, error: issues.join(', ') };
    }
    return { success: true, data: result.data };
  };
}