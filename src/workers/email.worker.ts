import { Job, Worker } from 'bullmq';
import { redisConfig } from '../config/redis.config';
import { transporter } from '../services/email.service';
import { EmailJobData } from '../types';

// Email worker
export const emailWorker = new Worker(
  'email',
  async (job: Job<EmailJobData>) => {
    const { to, html, subject, text } = job.data;

    try {
      await transporter.sendMail({
        from: `"${process.env.EMAIL_NAME}" <${process.env.EMAIL_FROM}>`,
        to,
        html,
        subject,
        text,
      });
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 5, // Process 5 emails concurrently
  }
);

// Worker event handlers
emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err.message);
});

emailWorker.on('error', (err) => {
  console.error('Email worker error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down email worker...');
  await emailWorker.close();
  process.exit(0);
});
