import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { runQuery, runInsert, runUpdate } from '../database';
import { autenticar, adminOnly, adminOrDiseniador } from '../middleware/auth';
import { success, error } from '../interfaces/responses';
import { registerWebhook, unregisterWebhook, registeredWebhooks, WebhookConfig } from '../services/webhooks';

const router = Router();

router.get('/stats', autenticar, adminOrDiseniador, (_req: Request, res: Response) => {
  try {
    const totalUsuarios = runQuery('SELECT COUNT(*) as total FROM usuarios')[0]?.total || 0;
    const totalPedidos = runQuery('SELECT COUNT(*) as total FROM pedidos')[0]?.total || 0;
    
    const pedidosPorEstado = runQuery(`
      SELECT estado_produccion as estado, COUNT(*) as total 
      FROM pedidos 
      GROUP BY estado_produccion
    `);
    
    const pedidosPorFase = runQuery(`
      SELECT fase, COUNT(*) as total 
      FROM pedidos 
      GROUP BY fase
    `);
    
    const pedidosMes = runQuery(`
      SELECT strftime('%Y-%m', created_at) as mes, COUNT(*) as total, SUM(total) as revenue
      FROM pedidos 
      WHERE created_at >= date('now', '-6 months')
      GROUP BY mes
      ORDER BY mes
    `);

    const topServicios = runQuery(`
      SELECT s.nombre, COUNT(p.id) as pedidos, SUM(p.total) as revenue
      FROM pedidos p
      JOIN servicios s ON p.servicio_id = s.id
      GROUP BY s.id
      ORDER BY pedidos DESC
      LIMIT 5
    `);

    const ultimosPedidos = runQuery(`
      SELECT p.id, p.tracking_id as trackingId, p.fase, p.estado_produccion as estado, p.total, 
             p.created_at as createdAt, s.nombre as servicio, u.nombre as cliente
      FROM pedidos p
      JOIN servicios s ON p.servicio_id = s.id
      JOIN usuarios u ON p.usuario_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    const archivosRecientes = runQuery(`
      SELECT a.id, a.nombre, a.url, a.formato, a.tamaño as tamano, a.created_at as createdAt, u.nombre as usuario
      FROM archivos a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    const mensajesSinLeer = runQuery(`
      SELECT COUNT(*) as total FROM mensajes WHERE leido = 0
    `)[0]?.total || 0;

    const ingresosTotales = runQuery(`
      SELECT SUM(total) as total FROM pedidos WHERE estado_produccion = 'completado'
    `)[0]?.total || 0;

    res.json(success({
      resumen: {
        totalUsuarios,
        totalPedidos,
        mensajesSinLeer,
        ingresosTotales,
      },
      pedidosPorEstado,
      pedidosPorFase,
      pedidosMes,
      topServicios,
      ultimosPedidos,
      archivosRecientes,
    }));
  } catch (err) {
    console.error('Error en /admin/stats:', (err as Error).message, (err as Error).stack);
    res.status(500).json(error('Error del servidor'));
  }
});

router.get('/stats/servicios', autenticar, adminOrDiseniador, (_req: Request, res: Response) => {
  try {
    const servicios = runQuery(`
      SELECT s.id, s.nombre, s.slug, COUNT(p.id) as pedidos, SUM(p.total) as revenue
      FROM servicios s
      LEFT JOIN pedidos p ON s.id = p.servicio_id
      GROUP BY s.id
      ORDER BY revenue DESC
    `);

    res.json(success(servicios));
  } catch (err) {
    res.status(500).json(error('Error del servidor'));
  }
});

router.get('/stats/dashboard', autenticar, adminOrDiseniador, (req: Request, res: Response) => {
  try {
    const esDiseniador = req.usuario?.rol === 'diseniador';
    const userId = req.usuario?.id;

    if (esDiseniador) {
      // ── Vista del diseñador: solo sus pedidos asignados ──
      const totalAsignados = runQuery(
        'SELECT COUNT(*) as total FROM pedidos WHERE diseniador_id = ?', [userId]
      )[0]?.total || 0;

      const asignadosHoy = runQuery(`
        SELECT COUNT(*) as total FROM pedidos 
        WHERE diseniador_id = ? AND date(created_at) = date('now')
      `, [userId])[0]?.total || 0;

      const pendientes = runQuery(`
        SELECT COUNT(*) as total FROM pedidos 
        WHERE diseniador_id = ? AND estado_produccion NOT IN ('entregado', 'cancelado')
      `, [userId])[0]?.total || 0;

      const entregados = runQuery(`
        SELECT COUNT(*) as total FROM pedidos 
        WHERE diseniador_id = ? AND estado_produccion = 'entregado'
      `, [userId])[0]?.total || 0;

      const pedidosPorEstado = runQuery(`
        SELECT estado_produccion as estado, COUNT(*) as cantidad
        FROM pedidos WHERE diseniador_id = ?
        GROUP BY estado_produccion
      `, [userId]);

      const pedidosPorMes = runQuery(`
        SELECT strftime('%Y-%m', created_at) as mes, COUNT(*) as cantidad
        FROM pedidos 
        WHERE diseniador_id = ? AND created_at >= date('now', '-6 months')
        GROUP BY mes
        ORDER BY mes
      `, [userId]);

      const pedidosRecientes = runQuery(`
        SELECT p.id, p.tracking_id as trackingId, p.estado_produccion as estado, p.total,
               p.created_at as fecha, p.item_nombre as servicio,
               p.cliente_nombre as cliente
        FROM pedidos p
        WHERE p.diseniador_id = ?
        ORDER BY p.created_at DESC
        LIMIT 10
      `, [userId]);

      return res.json(success({
        rol: 'diseniador',
        stats: {
          totalAsignados,
          asignadosHoy,
          pendientes,
          entregados,
        },
        pedidosPorMes,
        pedidosPorEstado,
        topServicios: [],
        pedidosRecientes,
      }));
    }

    // ── Vista del admin: estadísticas globales ──
    const totalPedidos = runQuery('SELECT COUNT(*) as total FROM pedidos')[0]?.total || 0;
    const pedidosHoy = runQuery(`
      SELECT COUNT(*) as total FROM pedidos 
      WHERE date(created_at) = date('now')
    `)[0]?.total || 0;
    
    const ingresosMes = runQuery(`
      SELECT COALESCE(SUM(total), 0) as total FROM pedidos 
      WHERE estado_produccion = 'entregado' 
      AND created_at >= date('now', '-30 days')
    `)[0]?.total || 0;
    
    const ticketPromedio = runQuery(`
      SELECT COALESCE(AVG(total), 0) as promedio FROM pedidos WHERE total > 0
    `)[0]?.promedio || 0;
    
    const usuariosActivos = runQuery('SELECT COUNT(*) as total FROM usuarios WHERE rol = "cliente"')[0]?.total || 0;

    const pedidosPorMes = runQuery(`
      SELECT strftime('%Y-%m', created_at) as mes, COUNT(*) as cantidad, COALESCE(SUM(total), 0) as ingresos
      FROM pedidos 
      WHERE created_at >= date('now', '-6 months')
      GROUP BY mes
      ORDER BY mes
    `);

    const pedidosPorEstado = runQuery(`
      SELECT estado_produccion as estado, COUNT(*) as cantidad
      FROM pedidos 
      GROUP BY estado_produccion
    `);

    const topServicios = runQuery(`
      SELECT s.nombre, s.icono, COUNT(p.id) as pedidos, COALESCE(SUM(p.total), 0) as revenue
      FROM servicios s
      LEFT JOIN pedidos p ON s.id = p.servicio_id
      GROUP BY s.id
      ORDER BY pedidos DESC
      LIMIT 5
    `);

    const pedidosRecientes = runQuery(`
      SELECT p.id, p.tracking_id as trackingId, p.estado_produccion as estado, p.total, 
             p.created_at as fecha, s.nombre as servicio, u.nombre as cliente
      FROM pedidos p
      LEFT JOIN servicios s ON p.servicio_id = s.id
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    res.json(success({
      rol: 'admin',
      stats: {
        totalPedidos,
        pedidosHoy,
        ingresosMes,
        ticketPromedio,
        usuariosActivos,
      },
      pedidosPorMes,
      pedidosPorEstado,
      topServicios,
      pedidosRecientes,
    }));
  } catch (err) {
    res.status(500).json(error('Error del servidor'));
  }
});

router.get('/stats/ingresos', autenticar, adminOrDiseniador, (req: Request, res: Response) => {
  try {
    const periodo = String(req.query.periodo || 'mes');
    let fechaInicio: string;
    
    switch (periodo) {
      case 'dia':
        fechaInicio = "date('now', '-1 day')";
        break;
      case 'semana':
        fechaInicio = "date('now', '-7 days')";
        break;
      case 'mes':
        fechaInicio = "date('now', '-30 days')";
        break;
      case 'año':
        fechaInicio = "date('now', '-365 days')";
        break;
      default:
        fechaInicio = "date('now', '-30 days')";
    }

    const ingresos = runQuery(`
      SELECT SUM(total) as total, COUNT(*) as pedidos
      FROM pedidos
      WHERE estado_produccion = 'completado' AND created_at >= ${fechaInicio}
    `);

    const diario = runQuery(`
      SELECT DATE(created_at) as fecha, SUM(total) as total, COUNT(*) as pedidos
      FROM pedidos
      WHERE estado_produccion = 'completado' AND created_at >= ${fechaInicio}
      GROUP BY DATE(created_at)
      ORDER BY fecha
    `);

    res.json(success({
      periodo,
      resumen: ingresos[0],
      diario,
    }));
  } catch (err) {
    res.status(500).json(error('Error del servidor'));
  }
});

router.get('/webhooks', (_req: Request, res: Response) => {
  res.json(success(registeredWebhooks.map((w: WebhookConfig) => ({
    url: w.url,
    events: w.events,
  }))));
});

router.post('/webhooks', adminOnly, (req: Request, res: Response) => {
  try {
    const { url, secret, events } = req.body;
    if (!url || !secret || !events?.length) {
      return res.status(400).json(error('URL, secret y events requeridos', 'MISSING_FIELDS', 400));
    }

    registerWebhook({ url, secret, events });
    res.json(success({ mensaje: 'Webhook registrado' }));
  } catch (err) {
    res.status(500).json(error('Error del servidor'));
  }
});

router.delete('/webhooks', adminOnly, (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json(error('URL requerida', 'MISSING_FIELDS', 400));
    }

    unregisterWebhook(url);
    res.json(success({ mensaje: 'Webhook eliminado' }));
  } catch (err) {
    res.status(500).json(error('Error del servidor'));
  }
});

router.get('/diseniadores', autenticar, adminOrDiseniador, (_req: Request, res: Response) => {
  try {
    const diseniadores = runQuery(`
      SELECT id, nombre, email, rol 
      FROM usuarios 
      WHERE rol IN ('diseniador', 'admin') AND activo = 1 
      ORDER BY rol DESC, nombre
    `);
    res.json({ success: true, data: diseniadores });
  } catch (err) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

// Endpoints de usuarios admin
router.get('/usuarios', autenticar, adminOnly, (req: Request, res: Response) => {
  try {
    const usuarios = runQuery(`
      SELECT id, uuid, nombre, email, rol, whatsapp, activo, created_at as createdAt
      FROM usuarios
      ORDER BY created_at DESC
    `);
    res.json({ success: true, usuarios });
  } catch (err) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.post('/usuarios', autenticar, adminOnly, (req: Request, res: Response) => {
  try {
    const { nombre, email, password, rol, whatsapp, activo } = req.body;
    
    if (!nombre || !email) {
      return res.status(400).json({ success: false, mensaje: 'Nombre y email requeridos' });
    }
    if (!password) {
      return res.status(400).json({ success: false, mensaje: 'Contraseña requerida' });
    }

    const existente = runQuery('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existente.length > 0) {
      return res.status(400).json({ success: false, mensaje: 'Ya existe un usuario con ese email' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const id = runInsert(
      'INSERT INTO usuarios (uuid, nombre, email, password, rol, whatsapp, activo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), nombre, email, hashedPassword, rol || 'cliente', whatsapp || null, activo !== false ? 1 : 0]
    );

    res.status(201).json({ success: true, id, mensaje: 'Usuario creado correctamente' });
  } catch (err: any) {
    console.error('Error al crear usuario:', err.message);
    res.status(500).json({ success: false, mensaje: 'Error: ' + err.message });
  }
});

router.put('/usuarios/:id', autenticar, adminOnly, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, email, rol, whatsapp, activo, password } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ success: false, mensaje: 'ID inválido' });
    }

    const existing = runQuery('SELECT id FROM usuarios WHERE id = ?', [id])[0];
    if (!existing) {
      return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });
    }

    if (email) {
      const duplicate = runQuery('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, id]);
      if (duplicate.length > 0) {
        return res.status(400).json({ success: false, mensaje: 'El email ya está en uso' });
      }
    }

    const activoValue = activo !== undefined ? (activo ? 1 : 0) : null;

    runUpdate(
      'UPDATE usuarios SET nombre = COALESCE(?, nombre), email = COALESCE(?, email), rol = COALESCE(?, rol), whatsapp = COALESCE(?, whatsapp), activo = COALESCE(?, activo) WHERE id = ?',
      [nombre || null, email || null, rol || null, whatsapp || null, activoValue, id]
    );

    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      runUpdate('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, id]);
    }

    res.json({ success: true, mensaje: 'Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.delete('/usuarios/:id', autenticar, adminOnly, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, mensaje: 'ID inválido' });
    }
    const existing = runQuery('SELECT id FROM usuarios WHERE id = ?', [id])[0];
    if (!existing) {
      return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });
    }
    runUpdate('UPDATE usuarios SET activo = 0 WHERE id = ?', [id]);
    res.json({ success: true, mensaje: 'Usuario desactivado' });
  } catch (err) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

// =========================================
// ENDPOINTS DE ADMINISTRADOR
// =========================================

router.get('/administradores', (_req: Request, res: Response) => {
  try {
    const admins = runQuery(`
      SELECT a.id, a.usuario_id as usuarioId, a.nombre, a.email, a.created_at as createdAt,
             u.whatsapp, u.activo
      FROM administrador a
      JOIN usuarios u ON a.usuario_id = u.id
      ORDER BY a.nombre
    `);
    res.json({ success: true, administradores: admins });
  } catch (err) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.post('/administradores', async (req: Request, res: Response) => {
  try {
    const { usuario_id, nombre, email } = req.body;
    if (!nombre || !email) return res.status(400).json({ success: false, mensaje: 'Nombre y email requeridos' });

    const existente = runQuery('SELECT id FROM administrador WHERE email = ? OR usuario_id = ?', [email, usuario_id || 0]);
    if (existente.length > 0) return res.status(400).json({ success: false, mensaje: 'Ya existe un administrador con ese email o usuario' });

    const usuario = runQuery('SELECT id FROM usuarios WHERE email = ?', [email])[0];
    if (!usuario) return res.status(400).json({ success: false, mensaje: 'Usuario no encontrado. Cree primero el usuario.' });

    const id = runInsert('INSERT INTO administrador (usuario_id, nombre, email) VALUES (?, ?, ?)',
      [usuario_id || usuario.id, nombre, email]);
    runUpdate('UPDATE usuarios SET rol = ? WHERE id = ?', ['admin', usuario_id || usuario.id]);

    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ success: false, mensaje: 'Error: ' + err.message });
  }
});

router.delete('/administradores/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const admin = runQuery('SELECT usuario_id FROM administrador WHERE id = ?', [id])[0];
    if (!admin) return res.status(404).json({ success: false, mensaje: 'Administrador no encontrado' });
    runUpdate('DELETE FROM administrador WHERE id = ?', [id]);
    runUpdate('UPDATE usuarios SET rol = ? WHERE id = ?', ['cliente', admin.usuario_id]);
    res.json({ success: true, mensaje: 'Administrador eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

export default router;