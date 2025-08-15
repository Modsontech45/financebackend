import Joi from 'joi';
import { UserStatus } from '../types';

// const base64ImagePattern = /^data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+$/;

// const profilePictureValidator = Joi.string().optional().custom((value, helpers) => {
//   const isUrl = Joi.string().uri().validate(value);
//   const isBase64 = base64ImagePattern.test(value);

//   if (!isUrl.error || isBase64) {
//     return value; // valid URL or base64
//   }
//   return helpers.error('any.invalid');
// }).messages({
//   'any.invalid': 'Profile picture must be a valid URL or a base64 image string',
//   'string.base': 'Profile picture must be a string',
// });

const baseUserFields = {
  firstName: Joi.string().optional().messages({
    'string.base': 'First name must be a string',
  }),
  lastName: Joi.string().optional().messages({
    'string.base': 'Last name must be a string',
  }),
  phoneNumber: Joi.string().optional(),
};

const rolesValidator = Joi.array().items(Joi.string()).min(1);
const rolesRequiredValidator = rolesValidator.required().messages({
  'array.min': 'At least one role must be assigned',
  'any.required': 'Roles are required',
});

const rolesOptionalValidator = rolesValidator.optional().messages({
  'array.min': 'At least one role must be assigned',
});

const statusValidator = Joi.string()
  .valid(...Object.values(UserStatus))
  .optional()
  .messages({
    'any.only': `Status must be one of: ${Object.values(UserStatus).join(', ')}`,
  });

// Create Company Invite Schema (Admin creates invite)
export const createCompanyInviteSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  roles: rolesRequiredValidator,
});

// Create Company User Schema (Admin creates user directly)
export const createCompanyUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  ...baseUserFields,
  roles: rolesRequiredValidator,
  status: statusValidator,
});

// Update Company User Schema (Admin updates user)
export const updateCompanyUserSchema = Joi.object({
  ...baseUserFields,
  roles: rolesOptionalValidator,
  status: statusValidator,
});

// Update User Schema (General)
export const updateUserSchema = Joi.object({
  ...baseUserFields,
});

// Accept Invite Schema (User accepts invite and sets details)
export const acceptInviteSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Invitation token is required',
  }),
  firstName: Joi.string().required().messages({
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().required().messages({
    'any.required': 'Last name is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
  phoneNumber: Joi.string().optional(),
});

export const verifyTokenSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Token is required',
  }),
});

export const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID must be a valid UUID',
    'any.required': 'ID is required',
  }),
});

export const userQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
  search: Joi.string().trim().min(1).max(255).optional().messages({
    'string.base': 'Search must be a string',
    'string.min': 'Search must not be empty',
    'string.max': 'Search cannot exceed 255 characters',
  }),
  status: Joi.string()
    .valid(...Object.values(UserStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(UserStatus)}`,
    }),
  role: Joi.string()
    .valid('ADMIN', 'USER', 'MODERATOR', 'MANAGER')
    .optional()
    .messages({
      'any.only': 'Role must be one of: ADMIN, USER, MODERATOR, MANAGER',
    }),
  sortBy: Joi.string()
    .valid(
      'firstName',
      'lastName',
      'email',
      'createdAt',
      'updatedAt',
      'lastLogin',
      'status',
      'role'
    )
    .optional()
    .messages({
      'any.only':
        'Sort by must be one of: firstName, lastName, email, createdAt, updatedAt, lastLogin, status, role',
    }),
  sortOrder: Joi.string().valid('ASC', 'DESC').optional().messages({
    'any.only': 'Sort order must be either ASC or DESC',
  }),
  includeInactive: Joi.boolean().optional().messages({
    'boolean.base': 'Include inactive must be a boolean',
  }),
});

export const inviteQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
  search: Joi.string().trim().min(1).max(255).optional().messages({
    'string.base': 'Search must be a string',
    'string.min': 'Search must not be empty',
    'string.max': 'Search cannot exceed 255 characters',
  }),
  status: Joi.string()
    .valid('ACTIVE', 'EXPIRED', 'USED', 'CANCELLED')
    .optional()
    .messages({
      'any.only': 'Status must be one of: ACTIVE, EXPIRED, USED, CANCELLED',
    }),
  role: Joi.string().trim().min(1).max(100).optional().messages({
    'string.base': 'Role must be a string',
    'string.min': 'Role must not be empty',
    'string.max': 'Role cannot exceed 100 characters',
  }),
  sortBy: Joi.string()
    .valid(
      'targetEmail',
      'firstName',
      'lastName',
      'status',
      'createdAt',
      'updatedAt',
      'expiresAt'
    )
    .optional()
    .messages({
      'any.only':
        'Sort by must be one of: targetEmail, firstName, lastName, status, createdAt, updatedAt, expiresAt',
    }),
  sortOrder: Joi.string().valid('ASC', 'DESC').optional().messages({
    'any.only': 'Sort order must be either ASC or DESC',
  }),
  includeExpired: Joi.boolean().optional().messages({
    'boolean.base': 'Include expired must be a boolean',
  }),
  dateFrom: Joi.date().iso().optional().messages({
    'date.base': 'Date from must be a valid date',
    'date.format': 'Date from must be in ISO format',
  }),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional().messages({
    'date.base': 'Date to must be a valid date',
    'date.format': 'Date to must be in ISO format',
    'date.min': 'Date to must be after date from',
  }),
});
