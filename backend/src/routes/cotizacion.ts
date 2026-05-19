import { Router, Request, Response } from 'express';
import { runQuery, runInsert } from '../database';
import { success, error } from '../interfaces/responses';

const router = Router();

// Calcular presupuesto automático
router.post('/calcular', (req: Request, res: Response) => {
  try {
    const { servicioId, materialId, cantidad, dimensiones, orientacion, resolucion } = req.body;

    if (!servicioId || !cantidad) {
      return res.status(400).json(error('Parámetros requeridos faltantes', 'VALIDATION_ERROR', 400));
    }

    const servicio = runQuery('SELECT precio_base, unidad FROM servicios WHERE id = ?', [servicioId])[0];
    if (!servicio) {
      return res.status(404).json(error('Servicio no encontrado', 'NOT_FOUND', 404));
    }

    let precioUnitario = servicio.precio_base || 0;
    let descuento = 0;

    // Si hay material específico, usar su precio
    if (materialId) {
      const material = runQuery('SELECT precio_unitario FROM materiales WHERE id = ?', [materialId])[0];
      if (material) {
        precioUnitario = material.precio_unitario;
      }
    }

    // Calcular precio por cantidad (economías de escala)
    if (cantidad >= 1000) {
      descuento = 0.20; // 20% descuento
    } else if (cantidad >= 500) {
      descuento = 0.15; // 15% descuento
    } else if (cantidad >= 100) {
      descuento = 0.10; // 10% descuento
    }

    const subtotal = precioUnitario * cantidad;
    const montoDescuento = subtotal * descuento;
    const subtotalConDescuento = subtotal - montoDescuento;
    const igv = subtotalConDescuento * 0.18;
    const total = subtotalConDescuento + igv;

    // Factores adicionales por resolución
    let factorResolucion = 1;
    if (resolucion === 600) {
      factorResolucion = 1.3; // 30% extra por alta resolución
    }

    const totalAjustado = total * factorResolucion;

    res.json(success({
      subtotal: subtotal.toFixed(2),
      descuento_porcentaje: descuento * 100,
      monto_descuento: montoDescuento.toFixed(2),
      igv: igv.toFixed(2),
      total: totalAjustado.toFixed(2),
      precio_unitario_final: (precioUnitario * factorResolucion).toFixed(2),
      unidad: servicio.unidad
    }));
  } catch (err: any) {
    console.error('Error calculando presupuesto:', err);
    res.status(500).json(error('Error del servidor'));
  }
});

// Validar disponibilidad de material
router.post('/validar-material', (req: Request, res: Response) => {
  try {
    const { materialId, cantidad } = req.body;

    if (!materialId || !cantidad) {
      return res.status(400).json(error('Parámetros requeridos faltantes', 'VALIDATION_ERROR', 400));
    }

    const material = runQuery(`
      SELECT id, nombre, tipo, stock, activo 
      FROM materiales 
      WHERE id = ?
    `, [materialId])[0];

    if (!material) {
      return res.status(404).json(error('Material no encontrado', 'NOT_FOUND', 404));
    }

    if (!material.activo) {
      return res.json(success({ 
        disponible: false, 
        razon: 'El material está inactivo' 
      }));
    }

    if (material.stock < cantidad) {
      return res.json(success({ 
        disponible: false, 
        stock_actual: material.stock,
        cantidad_solicitada: cantidad,
        razon: `Stock insuficiente. Solo hay ${material.stock} unidades disponibles.` 
      }));
    }

    res.json(success({ 
      disponible: true,
      stock: material.stock,
      material: material.nombre,
      tipo: material.tipo
    }));
  } catch (err: any) {
    res.status(500).json(error('Error del servidor'));
  }
});

// Validar compatibilidad material-formato
router.post('/validar-compatibilidad', (req: Request, res: Response) => {
  try {
    const { materialId, formato, gramaje } = req.body;

    const material = runQuery(`
      SELECT compatible_formato, gramaje, tipo, nombre
      FROM materiales 
      WHERE id = ?
    `, [materialId])[0];

    if (!material) {
      return res.status(404).json(error('Material no encontrado', 'NOT_FOUND', 404));
    }

    const compatibleFormatos = material.compatible_formato ? JSON.parse(material.compatible_formato) : [];
    
    let esCompatible = true;
    let razon = 'Compatible';

    // Verificar formato
    if (compatibleFormatos.length > 0 && !compatibleFormatos.includes(formato)) {
      esCompatible = false;
      razon = `El material ${material.nombre} no es compatible con el formato ${formato}`;
    }

    // Verificar gramaje si es necesario
    if (gramaje && material.gramaje) {
      if (gramaje > material.gramaje) {
        esCompatible = false;
        razon = `El gramaje solicitado (${gramaje}g) excede el máximo del material (${material.gramaje}g)`;
      }
    }

    res.json(success({ 
      compatible: esCompatible,
      razon,
      material: material.nombre,
      tipo: material.tipo
    }));
  } catch (err: any) {
    res.status(500).json(error('Error del servidor'));
  }
});

// Validar PDF para empaste
router.post('/validar-pdf', (req: Request, res: Response) => {
  try {
    const { urlPdf, paginasEsperadas, maxPaginas } = req.body;

    // En implementación real, aqui validaríamos el PDF
    // Por ahora simulamos validación exitosa
    // En producción usariamos pdf-parse o similar

    const validacion = {
      valido: true,
      paginas: Math.floor(Math.random() * 100) + 1, // Simulado
      tieneContraseña: false,
      tamaño: 1024 * 1024 * 5, // 5MB simulado
      message: 'PDF válido para empaste'
    };

    // Validar cantidad de páginas
    if (maxPaginas && validacion.paginas > maxPaginas) {
      validacion.valido = false;
      validacion.message = `El PDF tiene ${validacion.paginas} páginas, excede el máximo de ${maxPaginas} para este tipo de empaste`;
    }

    res.json(success(validacion));
  } catch (err: any) {
    res.status(500).json(error('Error validando PDF'));
  }
});

// Guardar configuración de producto
router.post('/config', (req: Request, res: Response) => {
  try {
    const { tipo_producto, dimensiones, orientacion, resolucion, material_preferido } = req.body;

    runInsert(`
      INSERT INTO cotizacion_config (tipo_producto, dimensiones_json, orientacion, resolucion, material_preferido)
      VALUES (?, ?, ?, ?, ?)
    `, [tipo_producto, dimensiones, orientacion, resolucion || 300, material_preferido]);

    res.json(success({ mensaje: 'Configuración guardada' }));
  } catch (err: any) {
    res.status(500).json(error('Error del servidor'));
  }
});

export default router;