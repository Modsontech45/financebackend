import { NextFunction, Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import {
  CreateTransactionData,
  TransactionQueryParams,
  TransactionType,
  UpdateTransactionData,
} from '../types/';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  // GET /api/transactions - List transactions with pagination and filtering
  getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate and parse query parameters
      const queryParams: TransactionQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        type: req.query.type as TransactionType,
        department: req.query.department as string,
        userId: req.query.userId as string,
        minAmount: req.query.minAmount
          ? parseFloat(req.query.minAmount as string)
          : undefined,
        maxAmount: req.query.maxAmount
          ? parseFloat(req.query.maxAmount as string)
          : undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
      };

      const result = await this.transactionService.getTransactions(
        queryParams,
        user.companyId
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/transactions/:id - Get transaction details
  getTransactionById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { user } = req;
      const { id } = req.params;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!id) {
        return res.status(400).json({ message: 'Transaction ID is required' });
      }

      const transaction = await this.transactionService.getTransactionById(
        id,
        user.companyId
      );

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/transactions - Create new transaction
  createTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { user } = req;
      console.log(user);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const transactionData: CreateTransactionData = req.body;

      const transaction = await this.transactionService.createTransaction(
        transactionData,
        user.companyId,
        user.id
      );

      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/transactions/:id - Update transaction
  updateTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { user } = req;
      const { id } = req.params;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!id) {
        return res.status(400).json({ message: 'Transaction ID is required' });
      }

      const updateData: UpdateTransactionData = req.body;

      const transaction = await this.transactionService.updateTransaction(
        id,
        updateData,
        user.companyId
      );

      res.json({
        success: true,
        data: transaction,
        message: 'Transaction updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/transactions/:id - Delete transaction
  deleteTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { user } = req;
      const { id } = req.params;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!id) {
        return res.status(400).json({ message: 'Transaction ID is required' });
      }

      const result = await this.transactionService.deleteTransaction(
        id,
        user.companyId
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  // Bulk operations (bonus methods)
  bulkDeleteTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { user } = req;
      const { transactionIds } = req.body;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
        return res
          .status(400)
          .json({ message: 'Transaction IDs array is required' });
      }

      const results = [];
      const errors = [];

      for (const id of transactionIds) {
        try {
          await this.transactionService.deleteTransaction(id, user.companyId);
          results.push({ id, success: true });
        } catch (error) {
          errors.push({
            id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.json({
        success: true,
        data: {
          successful: results,
          errors: errors,
          summary: {
            total: transactionIds.length,
            successful: results.length,
            failed: errors.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
