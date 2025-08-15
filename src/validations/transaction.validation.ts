import Joi from 'joi';
import { TransactionType } from '../types';
import { validateSchema } from '../utils/helpers';

// Create Transaction Schema
export const createTransactionSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
  }),
  comment: Joi.string().min(2).max(500).required().messages({
    'string.min': 'Comment must be at least 2 characters',
    'string.max': 'Comment cannot exceed 500 characters',
    'any.required': 'Comment is required',
  }),
  amount: Joi.number()
    .positive()
    .precision(2)
    .max(999999999.99)
    .required()
    .messages({
      'number.positive': 'Amount must be a positive number',
      'number.precision': 'Amount can have maximum 2 decimal places',
      'number.max': 'Amount cannot exceed 999,999,999.99',
      'any.required': 'Amount is required',
    }),
  type: Joi.string()
    .valid(...Object.values(TransactionType))
    .required()
    .messages({
      'any.only': `'Type must be one of: ${Object.values(TransactionType)}`,
      'any.required': 'Transaction type is required',
    }),
  department: Joi.string().optional().messages({
    'string.any': 'department must be a valid string',
  }),
  transactionDate: Joi.date()
    .iso()
    .max('now')
    .optional()
    .default(() => new Date())
    .messages({
      'date.iso': 'Please provide a valid date in ISO format',
      'date.max': 'Transaction date cannot be in the future',
    }),
});

// Update Transaction Schema
export const updateTransactionSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
  }),
  comment: Joi.string().min(2).max(500).optional().messages({
    'string.min': 'Comment must be at least 2 characters',
    'string.max': 'Comment cannot exceed 500 characters',
  }),
  amount: Joi.number()
    .positive()
    .precision(2)
    .max(999999999.99)
    .optional()
    .messages({
      'number.positive': 'Amount must be a positive number',
      'number.precision': 'Amount can have maximum 2 decimal places',
      'number.max': 'Amount cannot exceed 999,999,999.99',
    }),
  type: Joi.string()
    .valid('income', 'expense', 'transfer')
    .optional()
    .messages({
      'any.only': 'Type must be one of: income, expense, transfer',
    }),
  status: Joi.string()
    .valid('pending', 'completed', 'cancelled', 'failed')
    .optional()
    .messages({
      'any.only':
        'Status must be one of: pending, completed, cancelled, failed',
    }),
  department: Joi.string().optional().messages({
    'string.any': 'Department must be a valid string',
  }),
  transactionDate: Joi.date()
    .iso()
    .max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))
    .optional()
    .messages({
      'date.iso': 'Please provide a valid date in ISO format',
      'date.max': 'Transaction date cannot be more than one year in the future',
    }),
  reference: Joi.string().max(100).optional().allow('').messages({
    'string.max': 'Reference cannot exceed 100 characters',
  }),
  notes: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Notes cannot exceed 1000 characters',
  }),
  tags: Joi.array()
    .items(
      Joi.string().max(50).messages({
        'string.max': 'Each tag cannot exceed 50 characters',
      })
    )
    .max(10)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 10 tags',
    }),
  attachments: Joi.array()
    .items(
      Joi.string().uri().messages({
        'string.uri': 'Each attachment must be a valid URL',
      })
    )
    .max(5)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 5 attachments',
    }),
});

// Transaction Query Parameters Schema
export const transactionQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).max(10000).default(1).messages({
    'number.min': 'Page must be at least 1',
    'number.max': 'Page cannot exceed 10,000',
    'number.integer': 'Page must be an integer',
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
    'number.integer': 'Limit must be an integer',
  }),
  type: Joi.string()
    .valid('income', 'expense', 'transfer')
    .optional()
    .messages({
      'any.only': 'Type must be one of: income, expense, transfer',
    }),

  department: Joi.string().optional().messages({
    'string.any': 'department must be a valid string',
  }),
  userId: Joi.string().uuid().optional().messages({
    'string.uuid': 'User ID must be a valid UUID',
  }),
  startDate: Joi.date().iso().optional().messages({
    'date.iso': 'Please provide a valid start date in ISO format',
  }),
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .when('startDate', {
      is: Joi.exist(),
      then: Joi.date()
        .max(
          Joi.ref('startDate', {
            adjust: (value) =>
              new Date(value.getTime() + 730 * 24 * 60 * 60 * 1000),
          })
        )
        .messages({
          'date.max': 'Date range cannot exceed 2 years',
        }),
      otherwise: Joi.date(),
    })
    .optional()
    .messages({
      'date.iso': 'Please provide a valid end date in ISO format',
      'date.min': 'End date must be after or equal to start date',
    }),
  minAmount: Joi.number().positive().precision(2).optional().messages({
    'number.positive': 'Minimum amount must be a positive number',
    'number.precision': 'Amount can have maximum 2 decimal places',
  }),
  maxAmount: Joi.number()
    .positive()
    .precision(2)
    .min(Joi.ref('minAmount'))
    .optional()
    .messages({
      'number.positive': 'Maximum amount must be a positive number',
      'number.precision': 'Amount can have maximum 2 decimal places',
      'number.min':
        'Maximum amount must be greater than or equal to minimum amount',
    }),
  search: Joi.string().max(100).optional().messages({
    'string.max': 'Search term cannot exceed 100 characters',
  }),
  sortBy: Joi.string()
    .valid(
      'transactionDate',
      'amount',
      'comment',
      'type',
      'status',
      'createdAt',
      'updatedAt'
    )
    .default('transactionDate')
    .messages({
      'any.only':
        'Sort by must be one of: transactionDate, amount, comment, type, status, createdAt, updatedAt',
    }),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC').messages({
    'any.only': 'Sort order must be either ASC or DESC',
  }),
});

// Bulk Delete Schema
export const bulkDeleteSchema = Joi.object({
  transactionIds: Joi.array()
    .items(
      Joi.string().uuid().messages({
        'string.uuid': 'Each transaction ID must be a valid UUID',
      })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one transaction ID is required',
      'array.max': 'Cannot delete more than 50 transactions at once',
      'any.required': 'Transaction IDs array is required',
    }),
});

// Export Query Schema
export const exportQuerySchema = transactionQuerySchema
  .keys({
    format: Joi.string().valid('csv', 'excel', 'pdf').default('csv').messages({
      'any.only': 'Export format must be one of: csv, excel, pdf',
    }),
  })
  .without('page', 'limit'); // Remove pagination for export

// UUID Parameter Schema
export const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID must be a valid UUID',
    'any.required': 'ID is required',
  }),
});

// Transaction Summary Query Schema
export const summaryQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional().messages({
    'date.iso': 'Please provide a valid start date in ISO format',
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
    'date.iso': 'Please provide a valid end date in ISO format',
    'date.min': 'End date must be after or equal to start date',
  }),
});

// Individual validation functions for easier use
export const validateCreateTransaction = (data: object) =>
  validateSchema(createTransactionSchema, data);

export const validateUpdateTransaction = (data: object) =>
  validateSchema(updateTransactionSchema, data);

export const validateTransactionQuery = (data: object) =>
  validateSchema(transactionQuerySchema, data);

export const validateBulkDelete = (data: object) =>
  validateSchema(bulkDeleteSchema, data);

export const validateExportQuery = (data: object) =>
  validateSchema(exportQuerySchema, data);

export const validateUuidParam = (data: object) =>
  validateSchema(uuidParamSchema, data);

export const validateSummaryQuery = (data: object) =>
  validateSchema(summaryQuerySchema, data);
