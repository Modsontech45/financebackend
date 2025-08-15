import redisClient from '../config/redis.config';
import { RateLimitData, TokenData } from '../types/';
export class CacheService {
  static async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    parsed: boolean = true,
    ttl: number = 3600
  ): Promise<T> {
    // Try cache first
    if (await this.exists(key)) {
      const cachedData = await this.get<T>(key, parsed);
      if (cachedData) {
        return cachedData;
      }
    }

    // Cache miss - fetch and cache
    const result = await fetcher();
    if (result) {
      await this.set(key, result, ttl);
    }

    return result;
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const exists = await redisClient.exists(key);
      return exists > 0;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }
  // Basic cache operations
  static async get<T>(key: string, parsed: boolean = false): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (data) {
        console.log('From cache: ' + key, data);
      }
      return data ? ((parsed ? JSON.parse(data) : data) as T) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(
    key: string,
    data: any,
    ttlSeconds: number = 3600
  ): Promise<boolean> {
    try {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  static async delete(key: string): Promise<boolean> {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  static async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redisClient.keys(pattern);
      console.log({ keys });
      if (keys.length > 0) {
        return await redisClient.del(...keys);
      }
      return 0;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  // Auth token specific methods
  static async storeAuthToken(
    token: string,
    tokenData: TokenData,
    ttlSeconds: number = 3600
  ): Promise<boolean> {
    const key = `auth:token:${token}`;
    return await this.set(key, tokenData, ttlSeconds);
  }

  static async getAuthToken(
    token: string,
    parsed?: boolean
  ): Promise<TokenData | null> {
    const key = `auth:token:${token}`;
    return await this.get<TokenData>(key, parsed);
  }

  static async deleteAuthToken(token: string): Promise<boolean> {
    const key = `auth:token:${token}`;
    return await this.delete(key);
  }

  // User-based token management
  static async storeUserToken(
    userId: string,
    type: 'reset' | 'verify',
    tokenData: TokenData,
    ttlSeconds: number = 3600
  ): Promise<boolean> {
    const key = `auth:user:${userId}:${type}`;
    return await this.set(key, tokenData, ttlSeconds);
  }

  static async getUserToken(
    userId: string,
    type: 'reset' | 'verify'
  ): Promise<TokenData | null> {
    const key = `auth:user:${userId}:${type}`;
    return await this.get<TokenData>(key);
  }

  static async deleteUserToken(
    userId: string,
    type: 'reset' | 'verify'
  ): Promise<boolean> {
    const key = `auth:user:${userId}:${type}`;
    return await this.delete(key);
  }

  // Rate limiting for auth operations
  static async getRateLimit(
    identifier: string,
    operation: string
  ): Promise<RateLimitData | null> {
    const key = `rate:${operation}:${identifier}`;
    return await this.get<RateLimitData>(key);
  }

  static async setRateLimit(
    identifier: string,
    operation: string,
    data: RateLimitData,
    ttlSeconds: number = 3600
  ): Promise<boolean> {
    const key = `rate:${operation}:${identifier}`;
    return await this.set(key, data, ttlSeconds);
  }

  // User sessions (existing method enhanced)
  static async cacheUserSession(
    userId: string,
    sessionData: any,
    ttlSeconds: number = 86400
  ): Promise<void> {
    const key = `session:${userId}`;
    await this.set(key, sessionData, ttlSeconds);
  }

  static async getUserSession(userId: string): Promise<any> {
    const key = `session:${userId}`;
    return await this.get(key);
  }

  // Cleanup expired tokens (can be called periodically)
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const patterns = ['auth:token:*', 'auth:user:*', 'rate:*'];
      let cleaned = 0;

      for (const pattern of patterns) {
        cleaned += await this.deletePattern(pattern);
      }

      return cleaned;
    } catch (error) {
      console.error('Cleanup error:', error);
      return 0;
    }
  }

  // Analytics cache (existing methods)
  static async cacheAnalytics(
    companyId: string,
    data: any,
    ttlSeconds: number = 1800
  ): Promise<void> {
    const key = `analytics:${companyId}`;
    await this.set(key, data, ttlSeconds);
  }

  static async invalidateAnalytics(companyId: string): Promise<void> {
    await this.delete(`analytics:${companyId}`);
  }
}
