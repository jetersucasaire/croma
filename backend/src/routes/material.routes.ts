import { Router } from 'express';
import { MaterialController } from '../controllers';

const router = Router();
const controller = new MaterialController();

router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;