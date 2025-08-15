import { Job, Worker } from 'bullmq';
import { AppDataSource } from '../config/database.config';
import { redisConfig } from '../config/redis.config';
import { Transaction } from '../models/Transaction';
import { CacheService } from '../services/cache.service';
import { AnalyticsJobData, TransactionType } from '../types';

export const analyticsWorker = new Worker(
  'analytics',
  async (job: Job<AnalyticsJobData>) => {
    const { companyId, type } = job.data;

    try {
      const transactionRepo = AppDataSource.getRepository(Transaction);

      switch (type) {
        case 'summary':
          const summary = await calculateSummary(transactionRepo, companyId);
          await CacheService.cacheAnalytics(companyId, {
            type: 'summary',
            data: summary,
          });
          break;

        case 'monthly':
          const monthly = await calculateMonthlyData(
            transactionRepo,
            companyId
          );
          await CacheService.cacheAnalytics(companyId, {
            type: 'monthly',
            data: monthly,
          });
          break;

        case 'trends':
          const trends = await calculateTrends(transactionRepo, companyId);
          await CacheService.cacheAnalytics(companyId, {
            type: 'trends',
            data: trends,
          });
          break;
      }

      console.log(`✅ Analytics ${type} calculated for company ${companyId}`);
      return { success: true, type, companyId };
    } catch (error) {
      console.error(`❌ Failed to calculate ${type} analytics:`, error);
      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 3,
  }
);

// Helper functions for analytics calculations
async function calculateSummary(repo: any, companyId: string) {
  const [income, expenses] = await Promise.all([
    repo
      .createQueryBuilder('t')
      .select('SUM(t.amount)', 'total')
      .where('t.companyId = :companyId AND t.type = :type', {
        companyId,
        type: TransactionType.INCOME,
      })
      .getRawOne(),
    repo
      .createQueryBuilder('t')
      .select('SUM(t.amount)', 'total')
      .where('t.companyId = :companyId AND t.type = :type', {
        companyId,
        type: TransactionType.EXPENSE,
      })
      .getRawOne(),
  ]);

  const totalIncome = parseFloat(income.total) || 0;
  const totalExpenses = parseFloat(expenses.total) || 0;

  return {
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    calculatedAt: new Date(),
  };
}

async function calculateMonthlyData(repo: any, companyId: string) {
  const monthlyData = await repo
    .createQueryBuilder('t')
    .select([
      'DATE_FORMAT(t.transactionDate, "%Y-%m") as month',
      'SUM(CASE WHEN t.type = "income" THEN t.amount ELSE 0 END) as income',
      'SUM(CASE WHEN t.type = "expense" THEN t.amount ELSE 0 END) as expenses',
    ])
    .where('t.companyId = :companyId', { companyId })
    .groupBy('month')
    .orderBy('month', 'ASC')
    .getRawMany();

  interface MonthlyDataRaw {
    month: string;
    income: string | null;
    expenses: string | null;
  }

  interface MonthlyData {
    month: string;
    income: number;
    expenses: number;
    profit: number;
  }

  return (monthlyData as MonthlyDataRaw[]).map<MonthlyData>((item) => ({
    month: item.month,
    income: parseFloat(item.income ?? '0') || 0,
    expenses: parseFloat(item.expenses ?? '0') || 0,
    profit:
      (parseFloat(item.income ?? '0') || 0) -
      (parseFloat(item.expenses ?? '0') || 0),
  }));
}

async function calculateTrends(repo: any, companyId: string) {
  // Implementation for trend analysis
  const last6Months = await repo
    .createQueryBuilder('t')
    .select([
      'DATE_FORMAT(t.transactionDate, "%Y-%m") as month',
      'SUM(t.amount) as total',
      't.type as type',
    ])
    .where(
      't.companyId = :companyId AND t.transactionDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)',
      { companyId }
    )
    .groupBy('month, t.type')
    .orderBy('month', 'ASC')
    .getRawMany();

  return last6Months;
}

// Worker event handlers
analyticsWorker.on('completed', (job) => {
  console.log(`Analytics job ${job.id} completed successfully`);
});

analyticsWorker.on('failed', (job, err) => {
  console.error(`Analytics job ${job?.id} failed:`, err.message);
});

analyticsWorker.on('error', (err) => {
  console.error('Analytics worker error:', err);
});

process.on('SIGINT', async () => {
  console.log('Shutting down analytics worker...');
  await analyticsWorker.close();
  process.exit(0);
});
