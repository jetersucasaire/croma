import { Router, Request, Response } from 'express';
import { runQuery, runInsert } from '../database';
import { opcionalAuth } from '../middleware/auth';

const router = Router();

router.get('/:pedidoId/historial', opcionalAuth, (req: Request, res: Response) => {
  try {
    const pedidoId = req.params.pedidoId;
    const usuarioId = req.usuario?.id;
    const rol = req.usuario?.rol;

    const pedido = runQuery('SELECT usuario_id FROM pedidos WHERE id = ?', [pedidoId])[0];
    
    if (!pedido) {
      return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado' });
    }

    if (pedido.usuario_id !== usuarioId && rol !== 'admin') {
      return res.status(403).json({ success: false, mensaje: 'No autorizado' });
    }

    const historial = runQuery(`
      SELECT h.*, u.nombre as enviadoPorNombre
      FROM historial_contacto h
      LEFT JOIN usuarios u ON h.enviado_por = u.id
      WHERE h.pedido_id = ?
      ORDER BY h.created_at DESC
    `, [pedidoId]);

    res.json({ success: true, historial });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

router.post('/:pedidoId/whatsapp', (req: Request, res: Response) => {
  try {
    const pedidoId = req.params.pedidoId;
    const { mensaje } = req.body;
    const usuarioId = req.usuario?.id;

    if (!mensaje?.trim()) {
      return res.status(400).json({ success: false, mensaje: 'El mensaje no puede estar vacío' });
    }

    const pedido = runQuery(`
      SELECT p.*, u.nombre as usuarioNombre, u.whatsapp
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.id = ?
    `, [pedidoId])[0];
    
    if (!pedido) {
      return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado' });
    }

    if (!pedido.whatsapp) {
      return res.status(400).json({ success: false, mensaje: 'El cliente no tiene WhatsApp registrado' });
    }

    let whatsapp = pedido.whatsapp.replace(/\D/g, '');
    if (whatsapp.startsWith('51')) {
      whatsapp = '+' + whatsapp;
    } else if (whatsapp.startsWith('9')) {
      whatsapp = '+51' + whatsapp;
    } else {
      whatsapp = '+51' + whatsapp;
    }

    const mensajeEncoded = encodeURIComponent(mensaje);
    const waLink = `https://wa.me/${whatsapp}?text=${mensajeEncoded}`;

    runInsert(
      'INSERT INTO historial_contacto (pedido_id, canal, mensaje, enviado_por) VALUES (?, ?, ?, ?)',
      [pedidoId, 'whatsapp', mensaje, usuarioId]
    );

    res.json({ 
      success: true, 
      link: waLink,
      whatsapp: whatsapp 
    });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

export default router;