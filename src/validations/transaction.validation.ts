import Joi, { Schema } from 'joi';
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
    'string.base': 'Department must be a valid string',
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
    'string.base': 'Department must be a valid string',
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

// Replace all uses of Joi.ObjectSchema with Schema in helpers
export const validateCreateTransaction = (data: object) =>
  validateSchema(createTransactionSchema, data);

export const validateUpdateTransaction = (data: object) =>
  validateSchema(updateTransactionSchema, data);

// Continue with other schema exports as needed
