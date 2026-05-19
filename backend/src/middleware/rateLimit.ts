import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, mensaje: 'Demasiadas solicitudes, intenta más tarde' },
  skip: (req) => req.path === '/health',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, mensaje: 'Demasiados intentos, intenta en 15 minutos' },
  skip: (req) => req.path !== '/login' && req.path !== '/register',
});