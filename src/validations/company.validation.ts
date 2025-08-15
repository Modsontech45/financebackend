import Joi from 'joi';

export const createCompanySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Company name must be at least 2 characters',
    'string.max': 'Company name cannot exceed 100 characters',
    'any.required': 'Company name is required',
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': 'Description cannot exceed 500 characters',
  }),
  currencyId: Joi.string().uuid().required().messages({
    'string.uuid': 'Please provide a valid currency ID',
    'any.required': 'Currency is required',
  }),
});

export const updateCompanySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Company name must be at least 2 characters',
    'string.max': 'Company name cannot exceed 100 characters',
  }),
  description: Joi.string().max(500).optional().allow('').messages({
    'string.max': 'Description cannot exceed 500 characters',
  }),
  currencyId: Joi.string().uuid().optional().messages({
    'string.uuid': 'Please provide a valid currency ID',
  }),
});

export const addMemberSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required',
  }),
});
