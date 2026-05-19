import { Request, Response } from 'express';
import { PedidoService } from '../services';
import { runQuery } from '../database';

export class PedidoController {
  private service: PedidoService;
  
  constructor() {
    this.service = new PedidoService();
  }
  
  findAll = (req: Request, res: Response) => {
    try {
      const usuarioId = req.usuario?.id;
      const estado = String(req.query.estado) as string;
      const pedidos = this.service.getAll(usuarioId, estado);
      res.json({ success: true, data: pedidos });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  findAllAdmin = (req: Request, res: Response) => {
    try {
      const estado = String(req.query.estado) as string;
      const diseniadorId = req.usuario?.rol === 'diseniador' ? req.usuario.id : undefined;
      const pedidos = this.service.getAll(undefined, estado, diseniadorId);
      res.json({ success: true, data: pedidos });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  findById = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const pedido = this.service.getCompletoById(id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado' });
      }
      
      res.json({ success: true, data: pedido });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }

  findByIdAdmin = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const pedido = this.service.getCompletoById(id);
      
      if (!pedido) {
        return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado' });
      }
      
      res.json({ success: true, data: pedido });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  asignarDiseniador = (req: Request, res: Response) => {
    try {
      const pedidoId = parseInt(String(req.params.id));
      const diseniadorId = parseInt(String(req.body.diseniadorId));
      const asignadoPor = req.usuario?.nombre || 'El administrador';
      
      if (!diseniadorId || isNaN(diseniadorId)) {
        return res.status(400).json({ success: false, mensaje: 'ID de responsable requerido' });
      }
      
      this.service.asignarDiseniador(pedidoId, diseniadorId, asignadoPor);
      res.json({ success: true, mensaje: 'Responsable asignado correctamente' });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }

  create = (req: Request, res: Response) => {
    try {
      const usuarioId = req.usuario?.id;
      const body = req.body;
      const tipo = body.tipo === 'producto' ? 'producto' : 'servicio';

      let servicioId = body.servicioId ? Number(body.servicioId) : undefined;
      if (!servicioId && tipo === 'servicio' && body.itemId) {
        servicioId = Number(body.itemId);
      }

      let itemNombre = body.itemNombre || body.nombre;
      if (!itemNombre && servicioId) {
        const svc = runQuery('SELECT nombre FROM servicios WHERE id = ?', [servicioId])[0] as { nombre?: string } | undefined;
        itemNombre = svc?.nombre;
      }
      if (!itemNombre && body.itemId && tipo === 'producto') {
        const prod = runQuery('SELECT nombre FROM productos WHERE id = ?', [body.itemId])[0] as { nombre?: string } | undefined;
        itemNombre = prod?.nombre;
      }

      const clienteNombre = body.nombre || body.clienteNombre || req.usuario?.nombre;
      const clienteEmail = body.email || body.clienteEmail || req.usuario?.email;
      const clienteTelefono = body.telefono || body.clienteTelefono || (req.usuario as any)?.whatsapp;

      const total = Number(body.total ?? body.itemPrecio ?? 0) || 0;

      const id = this.service.create({
        usuarioId,
        servicioId,
        total,
        notas: body.notas,
        clienteNombre,
        clienteEmail,
        clienteTelefono,
        tipoItem: tipo,
        itemNombre,
        itemDescripcion: body.itemDescripcion || body.descripcion,
        medida: body.medida,
        color: body.color,
        disenoPersonalizado: body.diseno || body.disenoPersonalizado,
        material: body.material,
      });

      const pedido = this.service.getCompletoById(id);
      res.status(201).json({
        success: true,
        id,
        data: pedido,
        trackingId: pedido?.trackingId,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  update = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { fase, total, notas } = req.body;
      this.service.update(id, { fase, total, notas });
      res.json({ success: true, mensaje: 'Pedido actualizado' });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  updateEstado = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { estado, nota } = req.body;
      this.service.updateEstado(id, estado, nota);
      res.json({ success: true, mensaje: 'Estado actualizado' });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  saveDisenio = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const diseno = req.body;
      this.service.saveDisenio(id, diseno);
      res.json({ success: true, mensaje: 'Diseño guardado' });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }
  
  saveConfig = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const config = req.body;
      this.service.saveConfig(id, config);
      res.json({ success: true, mensaje: 'Configuración guardada' });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }

  addEntrega = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const urlDescarga = req.file ? `/uploads/entregas/${req.file.filename}` : (req.body.url_descarga || '');
      const version = req.body.version || '1.0';
      const comentario = req.body.comentario || '';
      const entregaId = this.service.addEntrega(id, urlDescarga, version, comentario);
      res.status(201).json({ success: true, id: entregaId, url: urlDescarga });
    } catch (error: any) {
      res.status(400).json({ success: false, mensaje: error.message });
    }
  }

  getEntregas = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const entregas = this.service.getEntregas(id);
      res.json({ success: true, data: entregas });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
  
  delete = (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      this.service.delete(id);
      res.json({ success: true, mensaje: 'Pedido cancelado' });
    } catch (error: any) {
      res.status(500).json({ success: false, mensaje: error.message });
    }
  }
}
