export interface AnalyticsSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  currency: {
    code: string;
    symbol: string;
  };
  period: {
    from: string;
    to: string;
  };
}
