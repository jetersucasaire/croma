import { Router } from 'express';
import { MensajeController } from '../controllers';
import { opcionalAuth } from '../middleware/auth';

const router = Router();
const controller = new MensajeController();

router.get('/:pedidoId/mensajes', controller.findByPedido);
router.post('/:pedidoId/mensajes', opcionalAuth, controller.create);
router.put('/:id/leer', controller.markAsRead);

export default router;