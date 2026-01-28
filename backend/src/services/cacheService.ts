// @ts-nocheck
import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';
import config from '../config';

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private readonly defaultTTL: number = 3600; // 1 hour default

  async connect(): Promise<void> {
    try {
      const redisUrl = config.redisUrl || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error', { error: err.message });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }

  private checkConnection(): void {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis not connected, cache operations will be skipped');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    this.checkConnection();

    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error', { error, key });
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    this.checkConnection();

    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const expiry = ttl ?? this.defaultTTL;

      if (expiry > 0) {
        await this.client.setEx(key, expiry, serialized);
      } else {
        await this.client.set(key, serialized);
      }

      return true;
    } catch (error) {
      logger.error('Cache set error', { error, key });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    this.checkConnection();

    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { error, key });
      return false;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    this.checkConnection();

    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      const keys: string[] = [];
      for await (const key of this.client.scanIterator({
        MATCH: pattern,
      })) {
        keys.push(key);
      }

      if (keys.length > 0) {
        await this.client.del(keys);
      }

      return keys.length;
    } catch (error) {
      logger.error('Cache delete pattern error', { error, pattern });
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    this.checkConnection();

    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      return (await this.client.exists(key)) === 1;
    } catch (error) {
      logger.error('Cache exists error', { error, key });
      return false;
    }
  }

  async flushDb(): Promise<boolean> {
    this.checkConnection();

    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.flushDb();
      logger.info('Cache database flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error', { error });
      return false;
    }
  }

  // Cache key generators
  static projectListKey(filter: any): string {
    return `projects:list:${JSON.stringify(filter)}`;
  }

  static projectDetailKey(id: string): string {
    return `project:detail:${id}`;
  }

  static projectDashboardKey(id: string): string {
    return `project:dashboard:${id}`;
  }

  static teamAllocationKey(projectId: string): string {
    return `team:allocation:${projectId}`;
  }

  static reportKey(type: string, id: string): string {
    return `report:${type}:${id}`;
  }

  // Get or set pattern with automatic TTL
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      logger.debug('Cache hit', { key });
      return cached;
    }

    logger.debug('Cache miss, fetching data', { key });
    const data = await factory();

    await this.set(key, data, ttl);
    return data;
  }
}

export const cacheService = new CacheService();
export default cacheService;
