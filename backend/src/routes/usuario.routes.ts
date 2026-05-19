import { Router } from 'express';
import { UsuarioController } from '../controllers';

const router = Router();
const controller = new UsuarioController();

router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;