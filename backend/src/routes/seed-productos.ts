import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runInsert } from '../database';

const router = Router();

router.post('/productos', (_req: Request, res: Response) => {
  try {
    const productos = [
      [uuidv4(), 'Bolígrafos Personalizados', 'boligrafos-personalizados', 'Bolígrafos con logo de empresa', null, 'Promocionales', 2.50, null, 1000, 'und'],
      [uuidv4(), 'Tazas Cerámicas', 'tazas-ceramicas', 'Tazas con diseño personalizado', null, 'Promocionales', 15.00, null, 500, 'und'],
      [uuidv4(), 'Llaveros Acrílicos', 'llaveros-acrilicos', 'Llaveros de acrílico personalizados', null, 'Promocionales', 3.00, null, 2000, 'und'],
      [uuidv4(), 'Calendarios de Mesa', 'calendarios-mesa', 'Calendarios de escritorio personalizados', null, 'Papeleria', 12.00, null, 300, 'und'],
      [uuidv4(), 'Agendas 2026', 'agendas-2026', 'Agendas corporativas personalizadas', null, 'Papeleria', 35.00, 28.00, 150, 'und'],
      [uuidv4(), 'Folders Corporativos', 'folders-corporativos', 'Folders con logo para oficinas', null, 'Papeleria', 5.00, null, 1000, 'und'],
      [uuidv4(), 'Banners Vinil', 'banners-vinil', 'Banners publicitarios de vinil', null, 'Senalamientos', 80.00, null, 50, 'und'],
      [uuidv4(), 'Rollups Publicitarios', 'rollups-publicitarios', 'Roll ups para ferias y eventos', null, 'Senalamientos', 150.00, 120.00, 30, 'und'],
      [uuidv4(), 'Placas de Honor', 'placas-honor', 'Placas reconocimiento grabar', null, 'Senalamientos', 45.00, null, 100, 'und'],
      [uuidv4(), 'Stickers circulares', 'stickers-circulares', 'Stickers redondos personalizados', null, 'Etiquetas', 0.50, null, 5000, 'und'],
      [uuidv4(), 'Etiquetas Adhesivas', 'etiquetas-adhesivas', 'Etiquetas para productos', null, 'Etiquetas', 0.30, null, 10000, 'und'],
      [uuidv4(), 'Talonarios Facturas', 'talonarios-facturas', 'Talonarios de facturación', null, 'Papeleria', 25.00, null, 200, 'und'],
    ];

    for (const p of productos) {
      runInsert(
        'INSERT INTO productos (uuid, nombre, slug, descripcion, imagen, categoria, precio, precio_oferta, stock, unidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p
      );
    }

    res.json({ success: true, mensaje: '12 productos insertados' });
  } catch (err: any) {
    console.error('Error seed productos:', err.message);
    res.status(500).json({ success: false, mensaje: 'Error: ' + err.message });
  }
});

export default router;