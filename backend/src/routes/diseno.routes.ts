import { Router } from 'express';
import { DisenoController } from '../controllers';

const router = Router();
const controller = new DisenoController();

router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;