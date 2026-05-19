import Redis from 'ioredis';
import { logger } from '../middleware/logger';

let redis: Redis | null = null;

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export function initRedis(config: RedisConfig): void {
  redis = new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.db || 0,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on('connect', () => {
    logger.info('Redis conectado');
  });

  redis.on('error', (err) => {
    logger.error({ error: err.message }, 'Error en Redis');
  });
}

export function getRedis(): Redis | null {
  return redis;
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (err: any) {
    logger.error({ error: err.message, key }, 'Error getting from cache');
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (!redis) return;
  try {
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, value);
    } else {
      await redis.set(key, value);
    }
  } catch (err: any) {
    logger.error({ error: err.message, key }, 'Error setting cache');
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err: any) {
    logger.error({ error: err.message, key }, 'Error deleting from cache');
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err: any) {
    logger.error({ error: err.message, pattern }, 'Error deleting pattern from cache');
  }
}

export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = await cacheGet(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }

  const data = await fetcher();
  await cacheSet(key, JSON.stringify(data), ttlSeconds);
  return data;
}

export async function invalidateCache(pattern: string): Promise<void> {
  await cacheDelPattern(pattern);
  logger.info({ pattern }, 'Cache invalidated');
}