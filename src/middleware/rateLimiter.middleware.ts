import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const rateLimit = (
  maxRequests: number,
  windowMs: number,
  message?: string
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    if (store[key].count >= maxRequests) {
      return res.status(429).json({
        status: 'error',
        message: message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
      });
    }

    store[key].count++;
    next();
  };
};

// Specific rate limiters
export const authRateLimit = rateLimit(
  5,
  15 * 60 * 1000,
  'Too many authentication attempts. Please try again in 15 minutes.'
);
export const generalRateLimit = rateLimit(
  100,
  15 * 60 * 1000,
  'Rate limit exceeded. Please try again later.'
);
