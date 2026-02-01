"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
// @ts-nocheck
const redis_1 = require("redis");
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = __importDefault(require("../config"));
class CacheService {
    client = null;
    isConnected = false;
    defaultTTL = 3600; // 1 hour default
    async connect() {
        try {
            const redisUrl = config_1.default.redisUrl || 'redis://localhost:6379';
            this.client = (0, redis_1.createClient)({
                url: redisUrl,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            logger_1.default.error('Redis reconnection failed after 10 attempts');
                            return new Error('Redis reconnection failed');
                        }
                        return Math.min(retries * 100, 3000);
                    },
                },
            });
            this.client.on('error', (err) => {
                logger_1.default.error('Redis Client Error', { error: err.message });
                this.isConnected = false;
            });
            this.client.on('connect', () => {
                logger_1.default.info('Redis client connected');
                this.isConnected = true;
            });
            this.client.on('disconnect', () => {
                logger_1.default.warn('Redis client disconnected');
                this.isConnected = false;
            });
            await this.client.connect();
        }
        catch (error) {
            logger_1.default.error('Failed to connect to Redis', { error });
            this.isConnected = false;
        }
    }
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.isConnected = false;
            logger_1.default.info('Redis client disconnected');
        }
    }
    checkConnection() {
        if (!this.client || !this.isConnected) {
            logger_1.default.warn('Redis not connected, cache operations will be skipped');
        }
    }
    async get(key) {
        this.checkConnection();
        if (!this.client || !this.isConnected) {
            return null;
        }
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            logger_1.default.error('Cache get error', { error, key });
            return null;
        }
    }
    async set(key, value, ttl) {
        this.checkConnection();
        if (!this.client || !this.isConnected) {
            return false;
        }
        try {
            const serialized = JSON.stringify(value);
            const expiry = ttl ?? this.defaultTTL;
            if (expiry > 0) {
                await this.client.setEx(key, expiry, serialized);
            }
            else {
                await this.client.set(key, serialized);
            }
            return true;
        }
        catch (error) {
            logger_1.default.error('Cache set error', { error, key });
            return false;
        }
    }
    async del(key) {
        this.checkConnection();
        if (!this.client || !this.isConnected) {
            return false;
        }
        try {
            await this.client.del(key);
            return true;
        }
        catch (error) {
            logger_1.default.error('Cache delete error', { error, key });
            return false;
        }
    }
    async delPattern(pattern) {
        this.checkConnection();
        if (!this.client || !this.isConnected) {
            return 0;
        }
        try {
            const keys = [];
            for await (const key of this.client.scanIterator({
                MATCH: pattern,
            })) {
                keys.push(key);
            }
            if (keys.length > 0) {
                await this.client.del(keys);
            }
            return keys.length;
        }
        catch (error) {
            logger_1.default.error('Cache delete pattern error', { error, pattern });
            return 0;
        }
    }
    async exists(key) {
        this.checkConnection();
        if (!this.client || !this.isConnected) {
            return false;
        }
        try {
            return (await this.client.exists(key)) === 1;
        }
        catch (error) {
            logger_1.default.error('Cache exists error', { error, key });
            return false;
        }
    }
    async flushDb() {
        this.checkConnection();
        if (!this.client || !this.isConnected) {
            return false;
        }
        try {
            await this.client.flushDb();
            logger_1.default.info('Cache database flushed');
            return true;
        }
        catch (error) {
            logger_1.default.error('Cache flush error', { error });
            return false;
        }
    }
    // Cache key generators
    static projectListKey(filter) {
        return `projects:list:${JSON.stringify(filter)}`;
    }
    static projectDetailKey(id) {
        return `project:detail:${id}`;
    }
    static projectDashboardKey(id) {
        return `project:dashboard:${id}`;
    }
    static teamAllocationKey(projectId) {
        return `team:allocation:${projectId}`;
    }
    static reportKey(type, id) {
        return `report:${type}:${id}`;
    }
    // Get or set pattern with automatic TTL
    async getOrSet(key, factory, ttl) {
        const cached = await this.get(key);
        if (cached !== null) {
            logger_1.default.debug('Cache hit', { key });
            return cached;
        }
        logger_1.default.debug('Cache miss, fetching data', { key });
        const data = await factory();
        await this.set(key, data, ttl);
        return data;
    }
}
exports.cacheService = new CacheService();
exports.default = exports.cacheService;
//# sourceMappingURL=cacheService.js.map