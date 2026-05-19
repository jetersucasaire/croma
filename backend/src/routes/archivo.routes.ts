import { Router } from 'express';
import { ArchivoController } from '../controllers';
import { opcionalAuth } from '../middleware/auth';

const router = Router();
const controller = new ArchivoController();

router.get('/', opcionalAuth, controller.findAll);
router.get('/:id', controller.findById);
router.get('/pedido/:pedidoId', controller.findByPedido);
router.post('/', controller.create);
router.delete('/:id', controller.delete);

export default router;