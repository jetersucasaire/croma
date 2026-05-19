import { Router } from 'express';
import { ServicioController } from '../controllers';

const router = Router();
const controller = new ServicioController();

router.get('/', controller.findAll);
router.get('/slug/:slug', controller.findBySlug);
router.get('/:id', controller.findById);
router.get('/:id/materiales', (req, res) => {
  res.json({ success: true, data: [] });
});
router.get('/:id/disenos', (req, res) => {
  res.json({ success: true, data: [] });
});
router.get('/:id/portafolio', controller.getPortafolio);
router.post('/', controller.create);
router.post('/:id/portafolio', controller.addPortafolio);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.delete('/:id/portafolio/:itemId', controller.deletePortafolio);

export default router;