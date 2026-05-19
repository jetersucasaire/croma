import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const isDev = process.env.NODE_ENV !== 'production'

const envSchema = z.object({
  port: z.string().default('3000'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string().optional().default(''),
  jwtSecret: isDev ? z.string().min(32).optional() : z.string().min(32),
  corsOrigin: z.string().default('*'),
  allowedOrigins: z.string().default(''),
  rateLimitWindowMs: z.string().default('15 minutes'),
  rateLimitMaxRequests: z.string().default('500'),
})

const parseResult = envSchema.safeParse(process.env)

if (!parseResult.success) {
  console.error('❌ Configuración inválida:')
  parseResult.error.issues.forEach(issue => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
  })
  process.exit(1)
}

const parsed = parseResult.data

export const env = {
  port: parseInt(parsed.port),
  nodeEnv: parsed.nodeEnv as 'development' | 'production' | 'test',
  databaseUrl: parsed.databaseUrl,
  jwtSecret: parsed.jwtSecret || (isDev ? 'dev-secret-key-for-development-only-32chars' : ''),
  corsOrigin: parsed.corsOrigin,
  allowedOrigins: parsed.allowedOrigins.split(',').map(o => o.trim()).filter(Boolean),
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10000,
  },
}