import { logger } from '../middleware/logger';

export interface WebhookPayload {
  event: string;
  pedido: {
    id: number;
    uuid: string;
    trackingId: string;
    fase: string;
    estado: string;
  };
  servicio: {
    nombre: string;
    icono: string;
  };
  cliente: {
    nombre: string;
    email: string;
    whatsapp?: string;
  };
  timestamp: string;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: string[];
}

export const registeredWebhooks: WebhookConfig[] = [];

export function registerWebhook(config: WebhookConfig): void {
  registeredWebhooks.push(config);
  logger.info({ url: config.url, events: config.events }, 'Webhook registrado');
}

export function unregisterWebhook(url: string): void {
  const index = registeredWebhooks.findIndex(w => w.url === url);
  if (index >= 0) {
    registeredWebhooks.splice(index, 1);
    logger.info({ url }, 'Webhook eliminado');
  }
}

export async function sendWebhook(payload: WebhookPayload): Promise<void> {
  for (const webhook of registeredWebhooks) {
    if (!webhook.events.includes(payload.event)) {
      continue;
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret,
          'X-Webhook-Event': payload.event,
        },
        body: JSON.stringify({
          ...payload,
          signature: generateSignature(payload, webhook.secret),
        }),
      });

      if (!response.ok) {
        logger.warn({ 
          url: webhook.url, 
          status: response.status,
          event: payload.event 
        }, 'Webhook falló');
      } else {
        logger.info({ 
          url: webhook.url, 
          event: payload.event 
        }, 'Webhook enviado');
      }
    } catch (err: any) {
      logger.error({ 
        error: err.message, 
        url: webhook.url 
      }, 'Error enviando webhook');
    }
  }
}

function generateSignature(payload: WebhookPayload, secret: string): string {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

export function createWebhookPayload(
  event: string,
  pedido: any,
  servicio: any,
  cliente: any
): WebhookPayload {
  return {
    event,
    pedido: {
      id: pedido.id,
      uuid: pedido.uuid,
      trackingId: pedido.tracking_id,
      fase: pedido.fase,
      estado: pedido.estado_produccion,
    },
    servicio: {
      nombre: servicio.nombre,
      icono: servicio.icono,
    },
    cliente: {
      nombre: cliente.nombre,
      email: cliente.email,
      whatsapp: cliente.whatsapp,
    },
    timestamp: new Date().toISOString(),
  };
}