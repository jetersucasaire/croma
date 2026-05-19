import { Router } from 'express';
import { ProyectoController } from '../controllers';
import { opcionalAuth } from '../middleware/auth';

const router = Router();
const controller = new ProyectoController();

router.get('/', opcionalAuth, controller.findAll);
router.get('/:id', controller.findById);
router.get('/:id/entregas', controller.getEntregas);
router.get('/:id/preferencias', controller.getPreferencias);
router.post('/', opcionalAuth, controller.create);
router.post('/:id/entregas', controller.addEntrega);
router.put('/:id', controller.update);
router.put('/:id/preferencias', controller.savePreferencias);

export default router;