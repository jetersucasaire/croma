import { Router } from 'express';
import { NotificacionController } from '../controllers';
import { opcionalAuth } from '../middleware/auth';

const router = Router();
const controller = new NotificacionController();

router.get('/', opcionalAuth, controller.findAll);
router.get('/sin-leer', opcionalAuth, controller.getSinLeer);
router.post('/', controller.create);
router.put('/:id/leer', controller.markAsRead);
router.put('/leer-todas', controller.markAllAsRead);

export default router;