import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runQuery, runInsert, runUpdate } from '../database';
import { opcionalAuth } from '../middleware/auth';

const router = Router();

function generarTrackingId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CROMA-${timestamp}-${random}`;
}

router.get('/servicios', (req: Request, res: Response) => {
  try {
    const servicios = runQuery(`
      SELECT id, uuid, nombre, slug, descripcion, icono, imagen, precio_base as precioBase, unidad
      FROM servicios WHERE activo = 1
      ORDER BY nombre
    `);
    
    res.json({ success: true, data: servicios });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.get('/servicio/:slug', (req: Request, res: Response) => {
  try {
    const servicio = runQuery(`
      SELECT id, nombre, slug, descripcion, icono, imagen, precio_base as precioBase, unidad
      FROM servicios WHERE slug = ? AND activo = 1
    `, [req.params.slug])[0];
    
    if (!servicio) {
      return res.status(404).json({ success: false, mensaje: 'Servicio no encontrado' });
    }

    res.json({ success: true, data: servicio });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.get('/:servicioId/disenos', (req: Request, res: Response) => {
  try {
    const disenos = runQuery(`
      SELECT id, nombre, imagen, ancho, alto, unidad
      FROM disenos WHERE servicio_id = ? AND activo = 1
      ORDER BY nombre
    `, [req.params.servicioId]);
    
    res.json({ success: true, disenos });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.get('/:servicioId/materiales', (req: Request, res: Response) => {
  try {
    const materiales = runQuery(`
      SELECT id, nombre, tipo, precio_unitario as precioUnitario, stock
      FROM materiales WHERE servicio_id = ? AND activo = 1
      ORDER BY nombre
    `, [req.params.servicioId]);
    
    res.json({ success: true, materiales });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.get('/sellos/armazones', (req: Request, res: Response) => {
  try {
    const mecanismo = req.query.mecanismo;
    let query = 'SELECT * FROM armazones WHERE activo = 1';
    const params: any[] = [];

    if (mecanismo) {
      query += ' AND mecanismo = ?';
      params.push(mecanismo);
    }

    query += ' ORDER BY precio';
    
    const armazones = runQuery(query, params);
    res.json({ success: true, armazones });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.post('/pedido', opcionalAuth, (req: Request, res: Response) => {
  try {
    const { servicioSlug, diseno, config } = req.body;

    const servicio = runQuery('SELECT id, nombre FROM servicios WHERE slug = ? AND activo = 1', [servicioSlug])[0];
    
    if (!servicio) {
      return res.status(404).json({ success: false, mensaje: 'Servicio no encontrado' });
    }

    const uuid = uuidv4();
    const trackingId = generarTrackingId();

    let total = 0;
    if (config?.materialId && config?.cantidad) {
      const material = runQuery('SELECT precio_unitario FROM materiales WHERE id = ?', [config.materialId])[0];
      if (material) {
        total = material.precio_unitario * config.cantidad;
      }
    }

    const clienteNombre = req.usuario?.nombre || req.body.clienteNombre || null;
    const clienteEmail = req.usuario?.email || req.body.clienteEmail || null;
    const clienteTelefono = (req.usuario as { whatsapp?: string })?.whatsapp || req.body.clienteTelefono || null;

    const pedidoId = runInsert(`
      INSERT INTO pedidos (
        uuid, usuario_id, servicio_id, fase, estado_produccion, total, tracking_id,
        cliente_nombre, cliente_email, cliente_telefono, tipo_item, item_nombre
      )
      VALUES (?, ?, ?, 'diseno', 'pendiente', ?, ?, ?, ?, ?, 'servicio', ?)
    `, [
      uuid, req.usuario?.id ?? null, servicio.id, total, trackingId,
      clienteNombre, clienteEmail, clienteTelefono, servicio.nombre,
    ]);

    runInsert(`
      INSERT INTO pedido_seguimiento_detallado (
        pedido_id, tipo_item, item_nombre, cliente_nombre, cliente_telefono, cliente_email, estado, tracking_id
      ) VALUES (?, 'servicio', ?, ?, ?, ?, 'pendiente', ?)
    `, [pedidoId, servicio.nombre, clienteNombre, clienteTelefono, clienteEmail, trackingId]);

    if (diseno) {
      runInsert(`
        INSERT INTO pedido_disenio (pedido_id, diseno_id, archivo_url, archivo_nombre, tipo_carga, enlace_externo, parametros)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        pedidoId,
        diseno.disenoId || null,
        diseno.archivoUrl || null,
        diseno.archivoNombre || null,
        diseno.tipoCarga || 'catalogo',
        diseno.enlaceExterno || null,
        JSON.stringify(diseno.parametros || {})
      ]);
    }

    if (config) {
      runInsert(`
        INSERT INTO pedido_config (pedido_id, material_id, cantidad, precio_unitario, opciones)
        VALUES (?, ?, ?, ?, ?)
      `, [
        pedidoId,
        config.materialId || null,
        config.cantidad || 1,
        config.precioUnitario || 0,
        JSON.stringify(config.opciones || {})
      ]);
    }

    // Guardar datos específicos según el tipo de servicio
    const opts = config?.opciones || {};
    if (servicioSlug === 'impresiones') {
      runInsert(`
        INSERT INTO impresion (pedido_id, tamano, orientacion, resolucion, tipo_papel, cantidad, color)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [pedidoId, opts.tamano || 'A4', opts.orientacion || 'vertical', opts.resolucion || 300, opts.tipoPapel || 'bond', opts.cantidad || 1, opts.color || 'color']);
    } else if (servicioSlug === 'empastados') {
      runInsert(`
        INSERT INTO empastado (pedido_id, tipo_tapa, grabado, correccion_academica, impresion_interna)
        VALUES (?, ?, ?, ?, ?)
      `, [pedidoId, opts.tipoTapa || 'blanda', opts.grabado || 'ninguno', opts.correccionAcademica ? 1 : 0, opts.impresionInterna ? 1 : 0]);
    } else if (servicioSlug === 'fotocheck') {
      runInsert(`
        INSERT INTO fotocheck (pedido_id, usa_diseno_propio, carga_masiva, url_csv, cantidad, notas)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [pedidoId, opts.usaDisenoPropio ? 1 : 0, opts.cargaMasiva ? 1 : 0, opts.urlCsv || null, opts.cantidad || 1, opts.notas || null]);
    } else if (servicioSlug === 'sellos-personalizados') {
      runInsert(`
        INSERT INTO sello_personalizado (pedido_id, tipo_sello, mecanismo, forma, contenido_texto, usa_diseno_existente, firma_vectorizada, estado_produccion)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')
      `, [pedidoId, opts.tipoSello || 'tradicional', opts.mecanismo || 'automatico', opts.forma || 'circular', opts.contenidoTexto || '', opts.usaDisenoExistente ? 1 : 0, opts.firmaVectorizada ? 1 : 0]);
    } else if (servicioSlug === 'edicion-audio-video') {
      runInsert(`
        INSERT INTO edicion_video (pedido_id, enlace_externo, duracion_estimada, formato_salida, instrucciones)
        VALUES (?, ?, ?, ?, ?)
      `, [pedidoId, opts.enlaceExterno || null, opts.duracionEstimada || null, opts.formatoSalida || 'mp4', opts.instrucciones || '']);
    } else if (servicioSlug === 'diseno-logos') {
      runInsert(`
        INSERT INTO diseno_logo (pedido_id, nombre_marca, estilo, colores_ref, estado_aprobacion)
        VALUES (?, ?, ?, ?, 'pendiente')
      `, [pedidoId, opts.nombreMarca || opts.detalle || '', opts.estilo || 'moderno', opts.coloresRef || null]);
    }

    runInsert(`
      INSERT INTO pedido_seguimiento (pedido_id, estado, nota)
      VALUES (?, 'pendiente', 'Pedido creado')
    `, [pedidoId]);

    res.json({
      success: true,
      pedido: { 
        id: pedidoId, 
        uuid, 
        trackingId, 
        fase: 'diseno', 
        estadoProduccion: 'pendiente',
        total 
      }
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.put('/pedido/:id', opcionalAuth, (req: Request, res: Response) => {
  try {
    const { fase, diseno, config, total } = req.body;
    const pedidoId = req.params.id;

    runUpdate('UPDATE pedidos SET fase = ?, total = COALESCE(?, total), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [fase, total || 0, pedidoId]);

    if (diseno) {
      const existenteDiseno = runQuery('SELECT id FROM pedido_disenio WHERE pedido_id = ?', [pedidoId])[0];
      
      if (existenteDiseno) {
        runUpdate(`
          UPDATE pedido_disenio SET diseno_id = ?, archivo_url = ?, archivo_nombre = ?, tipo_carga = ?, enlace_externo = ?
          WHERE pedido_id = ?
        `, [
          diseno.disenoId || null,
          diseno.archivoUrl || null,
          diseno.archivoNombre || null,
          diseno.tipoCarga || 'catalogo',
          diseno.enlaceExterno || null,
          pedidoId
        ]);
      } else {
        runInsert(`
          INSERT INTO pedido_disenio (pedido_id, diseno_id, archivo_url, archivo_nombre, tipo_carga, enlace_externo)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [pedidoId, diseno.disenoId || null, diseno.archivoUrl || null, diseno.archivoNombre || null, diseno.tipoCarga || 'catalogo', diseno.enlaceExterno || null]);
      }
    }

    if (config) {
      const existenteConfig = runQuery('SELECT id FROM pedido_config WHERE pedido_id = ?', [pedidoId])[0];
      
      if (existenteConfig) {
        runUpdate(`
          UPDATE pedido_config SET material_id = ?, cantidad = ?, precio_unitario = ?, opciones = ?
          WHERE pedido_id = ?
        `, [
          config.materialId || null,
          config.cantidad || 1,
          config.precioUnitario || 0,
          JSON.stringify(config.opciones || {}),
          pedidoId
        ]);
      } else {
        runInsert(`
          INSERT INTO pedido_config (pedido_id, material_id, cantidad, precio_unitario, opciones)
          VALUES (?, ?, ?, ?, ?)
        `, [pedidoId, config.materialId || null, config.cantidad || 1, config.precioUnitario || 0, JSON.stringify(config.opciones || {})]);
      }
    }

    if (fase) {
      runInsert(`
        INSERT INTO pedido_seguimiento (pedido_id, estado, nota)
        VALUES (?, ?, ?)
      `, [pedidoId, fase, `Fase actualizada a ${fase}`]);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.get('/pedidos/mis', opcionalAuth, (req: Request, res: Response) => {
  try {
    const pedidos = runQuery(`
      SELECT p.id, p.uuid, p.servicio_id as servicioId, p.fase, p.estado_produccion as estadoProduccion, 
             p.total, p.tracking_id as trackingId, p.created_at as createdAt,
             s.nombre as servicioNombre, s.icono as servicioIcono
      FROM pedidos p
      JOIN servicios s ON p.servicio_id = s.id
      WHERE p.usuario_id = ?
      ORDER BY p.created_at DESC
    `, [req.usuario?.id]);

    res.json({ success: true, pedidos });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.get('/pedido/:id', opcionalAuth, (req: Request, res: Response) => {
  try {
    const pedido = runQuery(`
      SELECT p.*, s.nombre as servicioNombre, s.icono as servicioIcono
      FROM pedidos p
      JOIN servicios s ON p.servicio_id = s.id
      WHERE p.id = ? AND (p.usuario_id = ? OR ? = 'admin')
    `, [req.params.id, req.usuario?.id, req.usuario?.rol])[0];

    if (!pedido) {
      return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado' });
    }

    const diseno = runQuery('SELECT * FROM pedido_disenio WHERE pedido_id = ?', [pedido.id])[0];
    const config = runQuery('SELECT * FROM pedido_config WHERE pedido_id = ?', [pedido.id])[0];
    const seguimiento = runQuery(`
      SELECT estado, nota, created_at as createdAt
      FROM pedido_seguimiento WHERE pedido_id = ? ORDER BY created_at DESC
    `, [pedido.id]);

    res.json({
      success: true,
      pedido: {
        ...pedido,
        diseno,
        config,
        seguimiento
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

export default router;