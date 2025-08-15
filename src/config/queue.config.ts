import { Queue } from 'bullmq';
import { redisConfig } from './redis.config';

const defaultJobOptions = {
  removeOnComplete: 50, // Keep 50 completed jobs
  removeOnFail: 100, // Keep 100 failed jobs
  attempts: 3, // Retry failed jobs 3 times
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
};
// Queue definitions
export const emailQueue = new Queue('email', {
  connection: redisConfig,
  defaultJobOptions,
});

export const analyticsQueue = new Queue('analytics', {
  connection: redisConfig,
  defaultJobOptions,
});

export const notificationQueue = new Queue('notification', {
  connection: redisConfig,
  defaultJobOptions,
});

// Job type definitions
