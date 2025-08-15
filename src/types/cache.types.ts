export interface TokenData {
  userId: string;
  email: string;
  type: 'reset' | 'verify';
  tokenId: string;
  key: String;
  createdAt: number;
  attempts: number;
  attemptsInInterval: number;
  lastAttempt?: number;
  nextRetryAt: number;
}

export interface RateLimitData {
  attempts: number;
  windowStart: number;
  blocked: boolean;
  blockExpires?: number;
}

export interface CacheConfig {
  list: number;
  detail: number;
  analytics: number;
}
