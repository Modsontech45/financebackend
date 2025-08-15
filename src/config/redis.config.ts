import Redis from 'ioredis';

// Redis connection configuration
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  // maxRetriesPerRequest: 3,
  lazyConnect: true,
};

// Create Redis instances
export const redisClient = new Redis(redisConfig);
export const redisSubscriber = new Redis(redisConfig);

// Connection event handlers
redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});

redisClient.on('error', (error) => {
  console.error('❌ Redis client error:', error);
});

redisSubscriber.on('connect', () => {
  console.log('✅ Redis subscriber connected');
});

redisSubscriber.on('error', (error) => {
  console.error('❌ Redis subscriber error:', error);
});

export default redisClient;
