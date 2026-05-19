import nodemailer from 'nodemailer';
import { logger } from '../middleware/logger';
import fs from 'fs';
import path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

export interface EmailTransporter {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

let transporter: nodemailer.Transporter | null = null;

export async function initEmail(config: EmailTransporter): Promise<void> {
  try {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      const testAccount = await nodemailer.createTestAccount();
      (transporter as any).options.auth = {
        user: testAccount.user,
        pass: testAccount.pass,
      };
    }

    logger.info({ host: config.host }, 'Email transporter inicializado');
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error inicializando email');
    throw err;
  }
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
  if (!transporter) {
    logger.warn('Email no configurado');
    return { success: false };
  }

  try {
    const info = await transporter.sendMail({
      from: '"CROMA" <noreply@croma.pe>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });

    logger.info({ to: options.to, subject: options.subject, messageId: info.messageId }, 'Email enviado');

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: (nodemailer as any).getTestMessageUrl ? (nodemailer as any).getTestMessageUrl(info) : undefined,
    };
  } catch (err: any) {
    logger.error({ error: err.message, to: options.to }, 'Error enviando email');
    return { success: false };
  }
}

export async function sendPedidoConfirmado(
  email: string,
  nombre: string,
  trackingId: string,
  servicio: string,
  total: number
): Promise<{ success: boolean }> {
  return sendEmail({
    to: email,
    subject: `Pedido confirmado - ${trackingId}`,
    html: `
      <h1>¡Gracias por tu pedido!</h1>
      <p>Hola ${nombre},</p>
      <p>Tu pedido ha sido confirmado:</p>
      <ul>
        <li><strong>Servicio:</strong> ${servicio}</li>
        <li><strong>Total:</strong> S/ ${total.toFixed(2)}</li>
        <li><strong>Tracking:</strong> ${trackingId}</li>
      </ul>
      <p>Puedes seguir tu pedido en: <a href="https://croma.pe/track/${trackingId}">https://croma.pe/track/${trackingId}</a></p>
    `,
  });
}

export async function sendPedidoCompletado(
  email: string,
  nombre: string,
  trackingId: string,
  servicio: string
): Promise<{ success: boolean }> {
  return sendEmail({
    to: email,
    subject: `Pedido completado - ${trackingId}`,
    html: `
      <h1>¡Tu pedido está listo!</h1>
      <p>Hola ${nombre},</p>
      <p>Tu pedido ha sido completado:</p>
      <ul>
        <li><strong>Servicio:</strong> ${servicio}</li>
        <li><strong>Tracking:</strong> ${trackingId}</li>
      </ul>
      <p>Gracias por confiar en CROMA.</p>
    `,
  });
}

export async function sendNuevoMensaje(
  email: string,
  nombre: string,
  pedidoTracking: string,
  mensaje: string
): Promise<{ success: boolean }> {
  return sendEmail({
    to: email,
    subject: `Nuevo mensaje en tu pedido ${pedidoTracking}`,
    html: `
      <h1>Nuevo mensaje</h1>
      <p>Hola ${nombre},</p>
      <p>Tienes un nuevo mensaje en tu pedido ${pedidoTracking}:</p>
      <blockquote>${mensaje}</blockquote>
      <p><a href="https://croma.pe/pedidos">Ver pedido</a></p>
    `,
  });
}