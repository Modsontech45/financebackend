// Enums
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
}

// Base Transaction Data
export interface BaseTransactionData {
  name: string;
  comment: string;
  amount: number;
  type: TransactionType;
  department?: string;
  transactionDate?: string | Date;
  action?: string;
}

// Create Transaction Data
export interface CreateTransactionData extends BaseTransactionData {}

// Update Transaction Data (all fields optional except those needed for validation)
export interface UpdateTransactionData extends Partial<BaseTransactionData> {}

// Transaction Query Parameters
export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  department?: string;
  userId?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Transaction Filter Options
export interface TransactionFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  types?: TransactionType[];
  departments?: string[];
  users?: string[];
  amountRange?: {
    min: number;
    max: number;
  };
  searchTerm?: string;
}
