import { Router } from 'express';
import { AuthController } from '../controllers';

const router = Router();
const controller = new AuthController();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', controller.me);
router.post('/olvidar-contrasena', controller.olvidarContrasena);
router.post('/restablecer-contrasena', controller.restablecerContrasena);

export default router;