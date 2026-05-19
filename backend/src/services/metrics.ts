import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import { Request, Response } from 'express';
import { logger } from '../middleware/logger';

let registry: Registry;

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [],
});

export const pedidosActivos = new Gauge({
  name: 'pedidos_activos',
  help: 'Número de pedidos activos por fase',
  labelNames: ['fase'],
  registers: [],
});

export const solicitudesAPI = new Counter({
  name: 'solicitudes_api_total',
  help: 'Total de solicitudes a la API',
  labelNames: ['endpoint', 'metodo'],
  registers: [],
});

export const archivosSubidos = new Counter({
  name: 'archivos_subidos_total',
  help: 'Total de archivos subidos',
  labelNames: ['formato'],
  registers: [],
});

export function initMetrics(): Registry {
  registry = new Registry();
  
  collectDefaultMetrics({ register: registry });
  
  registry.registerMetric(httpRequestsTotal);
  registry.registerMetric(httpRequestDuration);
  registry.registerMetric(pedidosActivos);
  registry.registerMetric(solicitudesAPI);
  registry.registerMetric(archivosSubidos);

  logger.info('Prometheus metrics inicializado');
  
  return registry;
}

export function getRegistry(): Registry {
  return registry;
}

export function metricsMiddleware(req: Request, res: Response, next: Function) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestsTotal.inc({ 
      method: req.method, 
      route, 
      status: res.statusCode 
    });
    
    httpRequestDuration.observe({ 
      method: req.method, 
      route, 
      status: res.statusCode 
    }, duration);
  });
  
  next();
}

export async function getMetrics() {
  return registry?.metrics() || '';
}

export async function getMetric(name: string) {
  return registry?.getSingleMetric(name)?.get() || '';
}