import { Router } from 'express';
import { PedidoController } from '../controllers';
import { opcionalAuth, autenticar, adminOnly, adminOrDiseniador } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const controller = new PedidoController();

const entregaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = 'uploads/entregas';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `entrega-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const uploadEntrega = multer({ storage: entregaStorage });

router.get('/mis', opcionalAuth, controller.findAll);
router.get('/admin/todos', autenticar, adminOrDiseniador, controller.findAllAdmin);
router.get('/admin/:id', autenticar, adminOrDiseniador, controller.findByIdAdmin);
router.put('/admin/:id/estado', autenticar, adminOrDiseniador, controller.updateEstado);
router.put('/admin/:id/asignar-diseniador', autenticar, adminOnly, controller.asignarDiseniador);
router.get('/:id', controller.findById);
router.post('/', opcionalAuth, controller.create);
router.put('/:id', opcionalAuth, controller.update);
router.put('/:id/estado', controller.updateEstado);
router.put('/:id/disenio', controller.saveDisenio);
router.put('/:id/config', controller.saveConfig);
router.post('/:id/entrega', uploadEntrega.single('archivo'), controller.addEntrega);
router.get('/:id/entregas', controller.getEntregas);
router.delete('/:id', controller.delete);

export default router;