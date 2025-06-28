import { Store } from 'express-session';
import RedisService from './redis.service';
import { logger } from '@/utils/logger';

export class RedisSessionStore extends Store {
  private redisService: RedisService;
  private prefix: string;

  constructor(redisService: RedisService, prefix: string = 'sess:') {
    super();
    this.redisService = redisService;
    this.prefix = prefix;
  }

  async get(sid: string, callback: (err: any, session?: any) => void): Promise<void> {
    try {
      const key = `${this.prefix}${sid}`;
      const data = await this.redisService.getClient().get(key);
      
      if (!data) {
        return callback(null, null);
      }
      
      const session = JSON.parse(data);
      callback(null, session);
    } catch (error) {
      logger.error(`Error getting session ${sid}:`, error);
      callback(error);
    }
  }

  async set(sid: string, session: any, callback?: (err?: any) => void): Promise<void> {
    try {
      const key = `${this.prefix}${sid}`;
      const data = JSON.stringify(session);
      const ttl = 24 * 60 * 60; // 24 hours
      
      await this.redisService.getClient().setEx(key, ttl, data);
      
      if (callback) {
        callback();
      }
    } catch (error) {
      logger.error(`Error setting session ${sid}:`, error);
      if (callback) {
        callback(error);
      }
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void): Promise<void> {
    try {
      const key = `${this.prefix}${sid}`;
      await this.redisService.getClient().del(key);
      
      if (callback) {
        callback();
      }
    } catch (error) {
      logger.error(`Error destroying session ${sid}:`, error);
      if (callback) {
        callback(error);
      }
    }
  }

  async touch(sid: string, session: any, callback?: (err?: any) => void): Promise<void> {
    try {
      // Touch is the same as set for our implementation
      await this.set(sid, session, callback);
    } catch (error) {
      logger.error(`Error touching session ${sid}:`, error);
      if (callback) {
        callback(error);
      }
    }
  }
} 