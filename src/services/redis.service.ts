import { createClient, RedisClientType } from 'redis';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export class RedisService {
  private client: RedisClientType;
  private isConnected = false;
  private connectionAttempted = false;

  constructor() {
    const clientOptions: any = {
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        connectTimeout: 5000, // 5 second timeout
        reconnectStrategy: false, // Disable automatic reconnection
      },
      database: config.redis.db,
    };

    // Only add URL if it's provided
    if (config.redis.url) {
      clientOptions.url = config.redis.url;
    }

    // Only add password if it's provided
    if (config.redis.password) {
      clientOptions.password = config.redis.password;
    }

    this.client = createClient(clientOptions);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('Redis client ready');
    });

    this.client.on('error', (error: Error) => {
      if (!this.connectionAttempted) {
        logger.error('Redis client error:', error);
        this.isConnected = false;
      }
    });

    this.client.on('end', () => {
      logger.info('Redis client disconnected');
      this.isConnected = false;
    });
  }

  public async connect(): Promise<void> {
    if (this.connectionAttempted) {
      return;
    }

    this.connectionAttempted = true;
    
    try {
      await this.client.connect();
      logger.info('Redis service connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis, falling back to memory sessions:', error);
      this.isConnected = false;
      // Don't throw error, just log it and continue with memory sessions
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('Redis service disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  public isClientConnected(): boolean {
    return this.isConnected;
  }

  // Helper methods for session management
  public async setSession(sessionId: string, data: any, ttl?: number): Promise<void> {
    if (!this.isConnected) {
      return; // Silently fail if Redis is not available
    }

    try {
      const key = `session:${sessionId}`;
      const value = JSON.stringify(data);
      
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error(`Error setting session ${sessionId}:`, error);
      // Don't throw error, just log it
    }
  }

  public async getSession(sessionId: string): Promise<any | null> {
    if (!this.isConnected) {
      return null; // Return null if Redis is not available
    }

    try {
      const key = `session:${sessionId}`;
      const value = await this.client.get(key);
      
      if (!value) {
        return null;
      }
      
      return JSON.parse(value);
    } catch (error) {
      logger.error(`Error getting session ${sessionId}:`, error);
      return null;
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    if (!this.isConnected) {
      return; // Silently fail if Redis is not available
    }

    try {
      const key = `session:${sessionId}`;
      await this.client.del(key);
    } catch (error) {
      logger.error(`Error deleting session ${sessionId}:`, error);
      // Don't throw error, just log it
    }
  }
}

export default RedisService; 