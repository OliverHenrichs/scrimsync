import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Configuration schema for validation
const configSchema = z.object({
  discord: z.object({
    token: z.string().min(1, 'Discord token is required'),
    clientId: z.string().min(1, 'Discord client ID is required'),
    guildId: z.string().optional(),
    clientSecret: z.string().optional(),
    callbackUrl: z.string().optional(),
  }),
  server: z.object({
    port: z.number().int().positive().default(3000),
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  }),
  security: z.object({
    jwtSecret: z.string().min(32, 'JWT secret must be at least 32 characters'),
    sessionSecret: z.string().min(32, 'Session secret must be at least 32 characters'),
  }),
  redis: z.object({
    url: z.string().optional(),
    host: z.string().default('localhost'),
    port: z.number().int().positive().default(6379),
    password: z.string().optional(),
    db: z.number().int().min(0).default(0),
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  }),
});

// Raw configuration from environment
const rawConfig = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: process.env.DISCORD_CALLBACK_URL,
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
    sessionSecret: process.env.SESSION_SECRET || 'default-session-secret-change-in-production',
  },
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  logging: {
    level: (process.env.LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug',
  },
};

// Validate and export configuration
export const config = configSchema.parse(rawConfig);

export type Config = typeof config; 