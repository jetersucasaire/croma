import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../middleware/logger';
import fs from 'fs';
import path from 'path';

export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

let client: S3Client | null = null;
let bucket: string = '';

export function initS3(config: S3Config): void {
  client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  bucket = config.bucket;
  logger.info({ bucket: config.bucket, region: config.region }, 'S3 inicializado');
}

export async function uploadFile(filePath: string, key?: string): Promise<UploadResult> {
  if (!client) {
    return { success: false, error: 'S3 no configurado' };
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = key || path.basename(filePath);
    
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: fileBuffer,
      ContentType: getContentType(fileName),
    });

    await client.send(command);

    const url = `https://${bucket}.s3.${(client as any).region}.amazonaws.com/${fileName}`;
    logger.info({ key: fileName }, 'Archivo subido a S3');

    return { success: true, url, key: fileName };
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error subiendo a S3');
    return { success: false, error: err.message };
  }
}

export async function uploadBuffer(buffer: Buffer, fileName: string): Promise<UploadResult> {
  if (!client) {
    return { success: false, error: 'S3 no configurado' };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: buffer,
      ContentType: getContentType(fileName),
    });

    await client.send(command);

    const url = `https://${bucket}.s3.${(client as any).region}.amazonaws.com/${fileName}`;
    return { success: true, url, key: fileName };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
  if (!client) return null;

  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(client, command, { expiresIn });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error generando URL firmada');
    return null;
  }
}

export async function deleteFile(key: string): Promise<boolean> {
  if (!client) return false;

  try {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await client.send(command);
    logger.info({ key }, 'Archivo eliminado de S3');
    return true;
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error eliminando de S3');
    return false;
  }
}

export async function listFiles(prefix?: string): Promise<string[]> {
  if (!client) return [];

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });
    const response = await client.send(command);
    return (response.Contents || []).map(obj => obj.Key || '');
  } catch (err: any) {
    return [];
  }
}

function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const types: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ai': 'application/illustrator',
  };
  return types[ext] || 'application/octet-stream';
}