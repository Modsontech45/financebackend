import {
  emailQueue,
  analyticsQueue,
  notificationQueue,
} from '../config/queue.config';
import type { AnalyticsJobData, NotificationJobData } from '../types';

export class QueueService {
  // Analytics queue methods
  static async calculateAnalytics(
    companyId: string,
    type: AnalyticsJobData['type'],
    userId: string
  ) {
    return await analyticsQueue.add(
      'calculate-analytics',
      {
        companyId,
        type,
        userId,
      },
      {
        delay: 2000, // Small delay to batch requests
      }
    );
  }

  static async scheduleAnalyticsRefresh(companyId: string) {
    // Schedule all analytics types
    const jobs = ['summary', 'monthly', 'trends'].map((type) =>
      this.calculateAnalytics(
        companyId,
        type as AnalyticsJobData['type'],
        'system'
      )
    );

    return await Promise.all(jobs);
  }

  // Notification queue methods
  static async sendNotification(notificationData: NotificationJobData) {
    return await notificationQueue.add('send-notification', notificationData);
  }

  // Queue management
  static async getQueueStats() {
    const [emailStats, analyticsStats, notificationStats] = await Promise.all([
      emailQueue.getJobCounts(),
      analyticsQueue.getJobCounts(),
      notificationQueue.getJobCounts(),
    ]);

    return {
      email: emailStats,
      analytics: analyticsStats,
      notification: notificationStats,
    };
  }

  static async clearCompletedJobs() {
    await Promise.all([
      emailQueue.clean(24 * 60 * 60 * 1000, 1000, 'completed'), // 24 hours, up to 1000 jobs
      analyticsQueue.clean(24 * 60 * 60 * 1000, 1000, 'completed'),
      notificationQueue.clean(24 * 60 * 60 * 1000, 1000, 'completed'),
    ]);
  }
}
