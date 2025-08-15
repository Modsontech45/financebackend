import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import {
  authenticate,
  requireFullAuthenticate,
} from '../middleware/auth.middleware';
import { generalRateLimit } from '../middleware/rateLimiter.middleware';
import { authorize, requireAnyRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import { ROLE_ENUM } from '../utils/constant';
import {
  bulkDeleteSchema,
  createTransactionSchema,
  transactionQuerySchema,
  updateTransactionSchema,
  uuidParamSchema,
} from '../validations/transaction.validation';

const router = Router();
const transactionController = new TransactionController();

// Bind controller methods to preserve 'this'
transactionController.getTransactions =
  transactionController.getTransactions.bind(transactionController);
transactionController.getTransactionById =
  transactionController.getTransactionById.bind(transactionController);
transactionController.createTransaction =
  transactionController.createTransaction.bind(transactionController);
transactionController.updateTransaction =
  transactionController.updateTransaction.bind(transactionController);
transactionController.deleteTransaction =
  transactionController.deleteTransaction.bind(transactionController);
transactionController.bulkDeleteTransactions =
  transactionController.bulkDeleteTransactions.bind(transactionController);

// Apply authentication and company middleware to all transaction routes
router.use(authenticate);
router.use(requireFullAuthenticate);

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions with pagination and filtering
 * @access  Private (Company members)
 * @cache   5 minutes
 */
router.get(
  '/',
  generalRateLimit,
  validate(transactionQuerySchema, 'query'),
  transactionController.getTransactions
);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get single transaction by ID
 * @access  Private (Transaction owner or admin)
 * @cache   10 minutes
 */
router.get(
  '/:id',
  generalRateLimit,
  validate(uuidParamSchema, 'params'),
  transactionController.getTransactionById
);

/**
 * @route   POST /api/transactions
 * @desc    Create new transaction
 * @access  Private (Company members with create permission)
 */
router.post(
  '/',
  generalRateLimit,
  validate(createTransactionSchema),
  requireAnyRole(ROLE_ENUM.MANAGER, ROLE_ENUM.ADMIN, ROLE_ENUM.SUPER_ADMIN),
  authorize('transaction', 'write'),
  transactionController.createTransaction
);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update existing transaction
 * @access  Private (Transaction owner or admin with update permission)
 */
router.put(
  '/:id',
  authorize('transaction', 'write'),
  generalRateLimit,
  validate(uuidParamSchema, 'params'),
  validate(updateTransactionSchema),
  transactionController.updateTransaction
);

/**
 * @route   DELETE /api/transactions/bulk
 * @desc    Bulk delete transactions
 * @access  Private (Admin only)
 */
router.delete(
  '/bulk',
  requireAnyRole(ROLE_ENUM.ADMIN, ROLE_ENUM.SUPER_ADMIN),
  authorize('transaction', 'delete'),
  generalRateLimit,
  validate(bulkDeleteSchema),
  transactionController.bulkDeleteTransactions
);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete transaction
 * @access  Private (Transaction owner or admin with delete permission)
 */
router.delete(
  '/:id',
  requireAnyRole(ROLE_ENUM.ADMIN, ROLE_ENUM.SUPER_ADMIN),
  authorize('transaction', 'delete'),
  generalRateLimit,
  validate(uuidParamSchema, 'params'),
  transactionController.deleteTransaction
);

export default router;
