import {
  Between,
  FindManyOptions,
  FindOptionsWhere,
  Like,
  Repository,
} from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Company } from '../models/Company';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import {
  CreateTransactionData,
  PaginatedResponse,
  TransactionQueryParams,
  TransactionType,
  UpdateTransactionData,
} from '../types/';
import { CACHE_CONFIG, PAGINATION } from '../utils/constant';
import { NotFoundError, ValidationError } from '../utils/error';
import { CacheService } from './cache.service';

export class TransactionService {
  private transactionRepo: Repository<Transaction>;
  private userRepo: Repository<User>;
  private companyRepo: Repository<Company>;

  constructor() {
    this.transactionRepo = AppDataSource.getRepository(Transaction);
    this.userRepo = AppDataSource.getRepository(User);
    this.companyRepo = AppDataSource.getRepository(Company);
  }

  // Generate cache keys
  private generateCacheKey(
    type: string,
    params: Record<string, unknown> = {}
  ): string {
    const keyParts = [type];
    if (params.id) keyParts.push(`${params.id}`);
    if (params.companyId) keyParts.push(`company:${params.companyId}`);
    if (params.page) keyParts.push(`page:${params.page}`);
    if (params.limit) keyParts.push(`limit:${params.limit}`);

    return `transaction:${keyParts.join(':')}`;
  }

  // Invalidate related caches
  private async invalidateTransactionCaches(
    companyId: string,
    transactionId?: string
  ): Promise<void> {
    const patterns = [
      `transaction:list:company:${companyId}*`,
      `transaction:analytics:company:${companyId}*`,
      `analytics:*:company:${companyId}*`,
    ];

    if (transactionId) {
      patterns.push(`transaction:detail:${transactionId}`);
    }

    await Promise.all(
      patterns.map((pattern) => CacheService.deletePattern(pattern))
    );
  }

  // Build query filters
  private buildQueryFilters(
    params: TransactionQueryParams,
    companyId: string
  ): FindManyOptions<Transaction> {
    const where: FindOptionsWhere<Transaction> = { companyId };
    const relations = ['currency', 'company'];

    // Date range filter
    if (params.startDate || params.endDate) {
      const startDate = params.startDate
        ? new Date(params.startDate)
        : new Date(0);
      const endDate = params.endDate ? new Date(params.endDate) : new Date();
      where.transactionDate = Between(startDate, endDate);
    }

    // Type filter
    if (params.type && Object.values(TransactionType).includes(params.type)) {
      where.type = params.type;
    }

    // Department filter
    if (params.department) {
      where.department = params.department;
    }

    // User filter
    if (params.userId) {
      where.createdBy = params.userId;
    }

    // Amount range filter
    if (params.minAmount !== undefined || params.maxAmount !== undefined) {
      const minAmount = params.minAmount || 0;
      const maxAmount = params.maxAmount || Number.MAX_SAFE_INTEGER;
      where.amount = Between(minAmount, maxAmount);
    }

    // Search filter
    if (params.search) {
      where.comment = Like(`%${params.search}%`);
    }

    // Sorting
    const order: any = {};
    if (params.sortBy) {
      order[params.sortBy] = params.sortOrder || 'DESC';
    } else {
      order.transactionDate = 'DESC';
      order.createdAt = 'DESC';
    }

    return {
      where,
      relations,
      order,
      skip:
        ((params.page || PAGINATION.defaultPage) - 1) *
        (params.limit || PAGINATION.defaultLimit),
      take: Math.min(
        params.limit || PAGINATION.defaultLimit,
        PAGINATION.maxLimit
      ),
    };
  }

  async getTransactions(
    params: TransactionQueryParams,
    companyId: string
  ): Promise<PaginatedResponse<Transaction>> {
    // Generate cache key
    const cacheKey = this.generateCacheKey('list', {
      companyId,
      page: params.page,
      limit: params.limit,
      filters: params,
    });
    return CacheService.withCache<PaginatedResponse<Transaction>>(
      cacheKey,
      async () => {
        // Build query
        const queryOptions = this.buildQueryFilters(params, companyId);

        // Execute query
        const [transactions, total] =
          await this.transactionRepo.findAndCount(queryOptions);

        const page = params.page || PAGINATION.defaultPage;
        const limit = Math.min(
          params.limit || PAGINATION.defaultLimit,
          PAGINATION.maxLimit
        );

        return {
          data: transactions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        };
      },
      true,
      CACHE_CONFIG.list
    );
  }

  async getTransactionById(
    id: string,
    companyId: string
  ): Promise<Transaction> {
    const cacheKey = `transaction:detail:${id}`;

    // Cache the result
    const result = await CacheService.withCache(
      cacheKey,
      async () => {
        const transaction = await this.transactionRepo.findOne({
          where: { id, companyId },
          relations: ['currency', 'company'],
        });

        if (!transaction) {
          throw new NotFoundError('Transaction not found');
        }
        return transaction;
      },
      true,
      CACHE_CONFIG.detail
    );
    return result;
  }

  async createTransaction(
    data: CreateTransactionData,
    companyId: string,
    userId: string
  ): Promise<Transaction> {
    console.log(companyId, userId, data);
    // Validate company exists
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new ValidationError('Company not found');
    }

    // Validate user exists and belongs to company
    const user = await this.userRepo.findOne({
      where: { id: userId, companyId },
    });
    if (!user) {
      throw new ValidationError('User not found or not authorized');
    }

    // validate data here
    // if (
    //   data.department &&
    //   !company.departments
    //     ?.map((d) => d?.toLowerCase())
    //     .includes(data.department?.toLowerCase())
    // ) {
    //   throw new ValidationError(
    //     `Provided Department does not exist in company department list`
    //   );
    // }

    // Create transaction
    const transaction = this.transactionRepo.create({
      ...data,
      companyId,
      company,
      createdBy: userId,
      currency: company.defaultCurrency,
      currencyId: company.currencyId,
      transactionDate: data.transactionDate
        ? new Date(data.transactionDate)
        : new Date(),
    });

    const savedTransaction = await this.transactionRepo.save(transaction);

    // Invalidate caches
    await this.invalidateTransactionCaches(companyId);

    // Load full transaction with relations
    const fullTransaction = await this.getTransactionById(
      savedTransaction.id,
      companyId
    );

    return fullTransaction;
  }

  async updateTransaction(
    id: string,
    data: UpdateTransactionData,
    companyId: string
  ): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { id, companyId },
      relations: ['company', 'currency'],
    });

    if (!transaction) {
      throw new ValidationError('Transaction not found');
    }

    // Check if transaction is locked (e.g., reconciled, archived)
    if (transaction.isLocked) {
      throw new ValidationError('Transaction is locked and cannot be modified');
    }

    // Update transaction
    Object.assign(transaction, {
      ...data,
      transactionDate: data.transactionDate
        ? new Date(data.transactionDate)
        : transaction.transactionDate,
      updatedAt: new Date(),
    });

    await this.transactionRepo.save(transaction);

    // Invalidate caches
    await this.invalidateTransactionCaches(companyId, id);

    return await this.getTransactionById(id, companyId);
  }

  async deleteTransaction(
    id: string,
    companyId: string
  ): Promise<{ message: string }> {
    const transaction = await this.transactionRepo.findOne({
      where: { id, companyId },
    });

    if (!transaction) {
      throw new ValidationError('Transaction not found');
    }

    // Check if transaction is locked
    if (transaction.isLocked) {
      throw new ValidationError('Transaction is locked and cannot be deleted');
    }

    await this.transactionRepo.remove(transaction);

    // Invalidate caches
    await this.invalidateTransactionCaches(companyId, id);

    return { message: 'Transaction deleted successfully' };
  }
}
