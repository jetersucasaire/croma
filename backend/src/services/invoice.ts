import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface InvoiceData {
  pedido: {
    id: number;
    uuid: string;
    trackingId: string;
    fase: string;
    estadoProduccion: string;
    total: number;
    createdAt: string;
    updatedAt: string;
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
  diseno?: {
    nombre?: string;
    archivoUrl?: string;
    archivoNombre?: string;
  };
  configuracion?: {
    material?: string;
    cantidad: number;
    precioUnitario: number;
  };
  seguimiento: Array<{
    estado: string;
    nota?: string;
    createdAt: string;
  }>;
}

export async function generateInvoice(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50 });
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(24).text('CROMA', { align: 'center' });
      doc.moveDown();
      doc.fontSize(18).text('COMPROBANTE DE PAGO', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12);
      doc.text(`Pedido #${data.pedido.id}`, { align: 'center' });
      doc.text(`Tracking: ${data.pedido.trackingId}`, { align: 'center' });
      doc.text(`Fecha: ${new Date(data.pedido.createdAt).toLocaleDateString('es-PE')}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text('DATOS DEL CLIENTE');
      doc.fontSize(12);
      doc.text(`Nombre: ${data.cliente.nombre}`);
      doc.text(`Email: ${data.cliente.email}`);
      if (data.cliente.whatsapp) {
        doc.text(`WhatsApp: ${data.cliente.whatsapp}`);
      }
      doc.moveDown();

      doc.fontSize(14).text('DETALLE DEL PEDIDO');
      doc.fontSize(12);
      doc.text(`Servicio: ${data.servicio.icono} ${data.servicio.nombre}`);
      doc.text(`Estado: ${data.pedido.fase} / ${data.pedido.estadoProduccion}`);
      
      if (data.diseno) {
        doc.text(`Diseño: ${data.diseno.nombre || data.diseno.archivoNombre || 'N/A'}`);
      }
      
      if (data.configuracion) {
        doc.text(`Material: ${data.configuracion.material || 'N/A'}`);
        doc.text(`Cantidad: ${data.configuracion.cantidad}`);
        doc.text(`Precio Unitario: S/ ${data.configuracion.precioUnitario.toFixed(2)}`);
      }
      doc.moveDown();

      doc.fontSize(16).text(`TOTAL: S/ ${data.pedido.total.toFixed(2)}`, { align: 'right' });
      doc.moveDown(2);

      doc.fontSize(10).text('HISTORIAL');
      for (const seg of data.seguimiento) {
        doc.text(`${seg.createdAt}: ${seg.estado}${seg.nota ? ` - ${seg.nota}` : ''}`);
      }
      doc.moveDown(2);

      doc.fontSize(8).text(
        'Gracias por confiar en CROMA. Este documento es una representación simbólica del pedido.',
        { align: 'center' }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateTrackingUrl(trackingId: string, baseUrl: string = 'https://croma.pe'): string {
  return `${baseUrl}/track/${trackingId}`;
}