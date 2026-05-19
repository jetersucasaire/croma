import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { env } from './config/env';
import { requestId, errorHandler, notFoundHandler } from './middleware/request';
import { apiLimiter, authLimiter } from './middleware/rateLimit';
import { logger } from './middleware/logger';
import { queryMiddleware } from './middleware/query';
import { inicializarDB, ejecutarMigraciones } from './database';
import { initSocket } from './services/socket';
import { initMetrics, getRegistry } from './services/metrics';

import authRouter from './routes/auth.routes';
import serviciosRouter from './routes/servicio.routes';
import disenosRouter from './routes/diseno.routes';
import materialesRouter from './routes/material.routes';
import pedidosRouter from './routes/pedido.routes';
import armazonesRouter from './routes/armazon.routes';
import categoriasRouter from './routes/categoria.routes';
import archivosRouter from './routes/archivo.routes';
import mensajesRouter from './routes/mensaje.routes';
import notificacionesRouter from './routes/notificacion.routes';
import proyectosRouter from './routes/proyecto.routes';
import usuariosRouter from './routes/usuario.routes';

import contactoRouter from './routes/contacto';
import adminRouter from './routes/admin';
import wizardRouter from './routes/wizard';
import importacionRouter from './routes/importacion';
import cotizacionRouter from './routes/cotizacion';
import pagosRouter from './routes/pagos';
import productosRouter from './routes/productos';
import seedProductosRouter from './routes/seed-productos';

const app = express();
const httpServer = createServer(app);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, env.corsOrigin === '*' || env.allowedOrigins.length === 0);
    }
    const allowed = env.corsOrigin === '*' 
      ? true 
      : env.allowedOrigins.includes(origin);
    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error('CORS no permitido'));
    }
  },
  credentials: true,
};

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
    },
  },
}));

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(requestId);
app.use(queryMiddleware);
app.use((req, res, next) => {
  req.logger.info({ IP: req.ip, userAgent: req.get('user-agent') }, 'Request');
  next();
});

inicializarDB().then(() => {
  logger.info('Base de datos SQLite inicializada');
  try {
    ejecutarMigraciones();
    logger.info('Migraciones ejecutadas');
  } catch (migError: any) {
    logger.error({ error: migError.message }, 'Error en migraciones');
  }

  const reg = initMetrics();
  initSocket(httpServer);

  app.use('/uploads', express.static('uploads'));

  app.use('/api/auth', authLimiter, authRouter);
  app.use('/api', apiLimiter);

  app.use('/api/servicios', serviciosRouter);
  app.use('/api/productos', productosRouter);
  app.use('/api/disenos', disenosRouter);
  app.use('/api/materiales', materialesRouter);
  app.use('/api/pedidos', pedidosRouter);
  app.use('/api/armazones', armazonesRouter);
  app.use('/api/wizard', wizardRouter);
  app.use('/api/categorias', categoriasRouter);
  app.use('/api/archivos', archivosRouter);
  app.use('/api/mensajes', mensajesRouter);
  app.use('/api/notificaciones', notificacionesRouter);
  app.use('/api/contacto', contactoRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/proyectos', proyectosRouter);
  app.use('/api/importacion', importacionRouter);
  app.use('/api/cotizacion', cotizacionRouter);
  app.use('/api/pagos', pagosRouter);
  app.use('/api/debug', seedProductosRouter);
  app.use('/api/usuarios', usuariosRouter);

  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', getRegistry().contentType);
    res.send(await getRegistry().metrics());
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  httpServer.listen(env.port, () => {
    logger.info({ port: env.port, env: env.nodeEnv }, 'Server started');
    console.log(`Server running on port ${env.port}`);
  });
}).catch((err) => {
  logger.fatal({ error: err.message }, 'Database initialization failed');
  process.exit(1);
});