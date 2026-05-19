import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runQuery, runInsert, runUpdate } from '../database';
import { opcionalAuth, autenticar, adminOnly } from '../middleware/auth';
import { crearPago, obtenerPago } from '../services/mercadopago';

const router = Router();

interface CarritoItem {
  id: number;
  nombre: string;
  cantidad: number;
  precio: number;
  tipo: 'servicio' | 'producto';
  descripcion?: string;
}

interface Carrito {
  items: CarritoItem[];
  total: number;
}

function generarTrackingId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CROMA-${timestamp}-${random}`;
}

function generarOrdenId(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

router.post('/crear-checkout', opcionalAuth, async (req: Request, res: Response) => {
  try {
    const { items, email, redirectUrl, nombre, telefono, direccion, notas } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, mensaje: 'No hay items en el carrito' });
    }

    const ordenId = generarOrdenId();
    const trackingId = generarTrackingId();
    
    const total = items.reduce((sum: number, item: CarritoItem) => 
      sum + (item.precio * item.cantidad), 0
    );

    const usuarioId = req.usuario?.id ?? null;
    const clienteNombre = nombre || req.usuario?.nombre || null;
    const clienteEmail = email || req.usuario?.email || null;
    const clienteTelefono = telefono || (req.usuario as { whatsapp?: string })?.whatsapp || null;
    const notasPedido = [notas, direccion ? `Dirección: ${direccion}` : ''].filter(Boolean).join(' | ') || null;

    const pedidoIds: number[] = [];
    for (const item of items as CarritoItem[]) {
      let servicioId: number | null = null;
      if (item.tipo === 'servicio') {
        const svc = runQuery('SELECT id FROM servicios WHERE id = ? OR nombre = ? LIMIT 1', [item.id, item.nombre])[0] as { id?: number };
        servicioId = svc?.id ?? item.id;
      }

      const lineTotal = (item.precio || 0) * (item.cantidad || 1);
      const uuid = uuidv4();
      const pedidoId = runInsert(`
        INSERT INTO pedidos (
          uuid, usuario_id, servicio_id, fase, estado_produccion, total, tracking_id, notas,
          cliente_nombre, cliente_email, cliente_telefono, tipo_item, item_nombre, item_descripcion
        ) VALUES (?, ?, ?, 'diseno', 'pendiente', ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        uuid,
        usuarioId,
        servicioId,
        lineTotal,
        trackingId,
        notasPedido,
        clienteNombre,
        clienteEmail,
        clienteTelefono,
        item.tipo || 'producto',
        item.nombre,
        item.descripcion || null,
      ]);
      pedidoIds.push(pedidoId);

      runInsert(`
        INSERT INTO pedido_seguimiento_detallado (
          pedido_id, tipo_item, item_nombre, item_descripcion, cliente_nombre, cliente_telefono, cliente_email,
          estado, tracking_id, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?)
      `, [
        pedidoId,
        item.tipo || 'producto',
        item.nombre,
        item.descripcion || null,
        clienteNombre,
        clienteTelefono,
        clienteEmail,
        trackingId,
        notasPedido,
      ]);
    }

    const descripcion = items.length === 1 
      ? items[0].nombre 
      : `${items.length} productos - Croma`;

    const pago = await crearPago({
      cantidad: total,
      descripcion,
      email: email || req.usuario?.email,
      externoId: ordenId,
    });

    if (pago) {
      res.json({
        success: true,
        orden: {
          id: ordenId,
          trackingId,
          total,
          items: items.length,
        },
        pago: {
          id: pago.id,
          estado: pago.estado,
          linkPago: pago.linkPago,
        },
        redirectUrl: redirectUrl || '/perfil',
      });
    } else {
      res.json({
        success: true,
        orden: {
          id: ordenId,
          trackingId,
          total,
          items: items.length,
          requierePagoManual: true,
        },
        mensaje: 'Pago generado. El cliente puede pagar en tienda.',
      });
    }
  } catch (error) {
    console.error('Error al crear checkout:', error);
    res.status(500).json({ success: false, mensaje: 'Error al procesar el pago' });
  }
});

router.get('/estado/:ordenId', opcionalAuth, async (req: Request, res: Response) => {
  try {
    const { ordenId } = req.params;
    
    const pedido = runQuery(`
      SELECT p.*, s.nombre as servicioNombre, s.icono as servicioIcono
      FROM pedidos p
      LEFT JOIN servicios s ON p.servicio_id = s.id
      WHERE p.tracking_id LIKE ?
    `, [`%${ordenId}%`])[0];

    if (!pedido) {
      return res.status(404).json({ success: false, mensaje: 'Orden no encontrada' });
    }

    res.json({
      success: true,
      orden: {
        id: pedido.id,
        trackingId: pedido.tracking_id,
        fase: pedido.fase,
        estadoProduccion: pedido.estado_produccion,
        total: pedido.total,
        fechaCreacion: pedido.created_at,
        servicio: {
          nombre: pedido.servicioNombre,
          icono: pedido.servicioIcono,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error al obtener estado' });
  }
});

router.post('/webhook-mercadopago', async (req: Request, res: Response) => {
  try {
    const { id, status, external_reference } = req.body;
    
    if (external_reference) {
      const nuevoEstado = status === 'approved' ? 'pagado' : 
                          status === 'pending' ? 'pendiente' : 
                          status === 'rejected' ? 'rechazado' : 'pendiente';

      console.log(`Webhook MercadoPago: Orden ${external_reference}, Estado: ${status}`);
      
      runUpdate(`
        UPDATE pedido_seguimiento_detallado 
        SET estado = ?, updated_at = CURRENT_TIMESTAMP
        WHERE tracking_id LIKE ?
      `, [nuevoEstado, `%${external_reference}%`]);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).json({ received: false });
  }
});

router.post('/confirmar-manual', autenticar, (req: Request, res: Response) => {
  try {
    const { ordenId, metodoPago } = req.body;
    
    const trackingId = generarTrackingId();
    
    res.json({
      success: true,
      mensaje: 'Pago confirmado manualmente',
      trackingId,
    });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error al confirmar pago' });
  }
});

export default router;