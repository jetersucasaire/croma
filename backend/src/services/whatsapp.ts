import { logger } from '../middleware/logger';

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion?: string;
}

export interface WhatsAppMessage {
  to: string;
  message?: string;
  template?: string;
  components?: any[];
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

let config: WhatsAppConfig | null = null;

export function initWhatsApp(conf: WhatsAppConfig): void {
  config = conf;
  logger.info({ phoneNumberId: conf.phoneNumberId }, 'WhatsApp inicializado');
}

export async function sendMessage(msg: WhatsAppMessage): Promise<WhatsAppResponse> {
  if (!config) {
    logger.warn('WhatsApp no configurado');
    return { success: false, error: 'WhatsApp no configurado' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion || 'v18.0'}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: msg.to.replace(/[^0-9]/g, ''),
          type: msg.template ? 'template' : 'text',
          text: msg.template ? undefined : { body: msg.message },
          template: msg.template ? {
            name: msg.template,
            language: { code: 'es_PE' },
            components: msg.components || [],
          } : undefined,
        }),
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      logger.error({ error: data }, 'Error enviando WhatsApp');
      return { success: false, error: data.error?.message || 'Error desconocido' };
    }

    logger.info({ to: msg.to, messageId: data.messages?.[0]?.id }, 'WhatsApp enviado');
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error en WhatsApp');
    return { success: false, error: err.message };
  }
}

export async function sendPedidoConfirmado(
  numero: string,
  nombre: string,
  trackingId: string,
  servicio: string
): Promise<WhatsAppResponse> {
  return sendMessage({
    to: numero,
    template: 'pedido_confirmado',
    components: [
      { type: 'body', parameters: [{ type: 'text', parameter_name: 'nombre', text: nombre }] },
      { type: 'body', parameters: [{ type: 'text', parameter_name: 'servicio', text: servicio }] },
      { type: 'body', parameters: [{ type: 'text', parameter_name: 'tracking', text: trackingId }] },
    ],
  });
}

export async function sendPedidoCompletado(
  numero: string,
  nombre: string,
  trackingId: string
): Promise<WhatsAppResponse> {
  return sendMessage({
    to: numero,
    message: `¡Hola ${nombre}! 👋\n\nTu pedido ${trackingId} está listo para recoger.\n\nGracias por confiar en CROMA.`,
  });
}

export async function sendEstadoActualizado(
  numero: string,
  trackingId: string,
  estado: string,
  fase: string
): Promise<WhatsAppResponse> {
  return sendMessage({
    to: numero,
    message: `📦 Actualización de tu pedido ${trackingId}\n\nEstado: ${estado}\nFase: ${fase}\n\nVer más: https://croma.pe/track/${trackingId}`,
  });
}

export async function sendNuevoMensaje(
  numero: string,
  nombre: string,
  trackingId: string
): Promise<WhatsAppResponse> {
  return sendMessage({
    to: numero,
    message: `💬 ${nombre}, tienes un nuevo mensaje en tu pedido ${trackingId}.\n\nVer: https://croma.pe/pedidos/${trackingId}`,
  });
}

function formatNumber(numero: string): string {
  const digits = numero.replace(/[^0-9]/g, '');
  if (digits.startsWith('51')) return `+${digits}`;
  if (digits.startsWith('9')) return `+51${digits}`;
  return `+51${digits}`;
}