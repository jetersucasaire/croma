import { logger } from '../middleware/logger';

export interface PagoConfig {
  accessToken: string;
  sandbox?: boolean;
}

export interface CrearPagoParams {
  cantidad: number;
  descripcion: string;
 email?: string;
  externoId?: string;
}

export interface Pago {
  id: string;
  estado: string;
  cantidad: number;
  descripcion: string;
  linkPago?: string;
  fechaCreado?: string;
  fechaAprobado?: string;
}

let config: PagoConfig | null = null;

export function initPagos(conf: PagoConfig): void {
  config = conf;
  logger.info({ sandbox: conf.sandbox }, 'MercadoPago inicializado');
}

export async function crearPago(params: CrearPagoParams): Promise<Pago | null> {
  if (!config) {
    logger.warn('MercadoPago no configurado');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments${config.sandbox ? '/sandbox' : ''}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_amount: params.cantidad,
          description: params.descripcion,
          payment_method_id: 'PIX',
          payer: {
            email: params.email || 'cliente@croma.pe',
          },
          external_reference: params.externoId,
          notification_url: 'https://croma.pe/api/webhooks/mercadopago',
        }),
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      logger.error({ error: data }, 'Error creando pago MercadoPago');
      return null;
    }

    logger.info({ paymentId: data.id, estado: data.status }, 'Pago creado');
    return {
      id: data.id,
      estado: data.status,
      cantidad: data.transaction_amount,
      descripcion: data.description,
      linkPago: data.point_ofInteraction?.authorizationUrl || data.init_point,
      fechaCreado: data.date_created,
      fechaAprobado: data.date_approved,
    };
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error en MercadoPago');
    return null;
  }
}

export async function obtenerPago(id: string): Promise<Pago | null> {
  if (!config) return null;

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { 'Authorization': `Bearer ${config.accessToken}` },
    });

    const data = await response.json() as any;
    if (!response.ok) return null;

    return {
      id: data.id,
      estado: data.status,
      cantidad: data.transaction_amount,
      descripcion: data.description,
      fechaCreado: data.date_created,
      fechaAprobado: data.date_approved,
    };
  } catch (err: any) {
    return null;
  }
}

export async function webhookPago(data: any): Promise<{ pedidoId?: string; estado: string } | null> {
  const estados: Record<string, string> = {
    'approved': 'completado',
    'pending': 'pendiente',
    'rejected': 'rechazado',
    'refunded': 'reembolsado',
  };

  return {
    pedidoId: data.external_reference,
    estado: estados[data.status] || 'pendiente',
  };
}