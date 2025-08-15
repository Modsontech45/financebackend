import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { validateSchema } from '../utils/helpers';

export const validate = (
  schema: Joi.ObjectSchema,
  property: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if body exists and isn't empty
    const methodsRequiringBody = ['POST', 'PUT', 'PATCH'];
    // || Object.keys(req.body).length === 0
    if (methodsRequiringBody.includes(req.method) && !req.body) {
      return res.status(400).json({
        error: 'Request body is required for this operation',
      });
    }

    const { errors, value } = validateSchema(schema, req[property]);

    if (errors) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors,
      });
    }
    // Replace or merge validated value depending on property
    if (property === 'body') {
      req.body = value;
    } else {
      // For query and params, copy validated properties into the existing object
      Object.assign(req[property], value);
    }

    next();
  };
};

// export const commonSchemas = {
//   // UUID parameter validation
//   uuidParam: Joi.object({
//     id: Joi.string().uuid().required().messages({
//       'string.uuid': 'Invalid ID format',
//       'any.required': 'ID is required'
//     })
//   }),

//   // Pagination query validation
//   pagination: Joi.object({
//     page: Joi.number().integer().min(1).default(1).messages({
//       'number.base': 'Page must be a number',
//       'number.integer': 'Page must be an integer',
//       'number.min': 'Page must be at least 1'
//     }),
//     limit: Joi.number().integer().min(1).max(100).default(10).messages({
//       'number.base': 'Limit must be a number',
//       'number.integer': 'Limit must be an integer',
//       'number.min': 'Limit must be at least 1',
//       'number.max': 'Limit cannot exceed 100'
//     }),
//     sortBy: Joi.string().optional().messages({
//       'string.base': 'Sort by must be a string'
//     }),
//     sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC').messages({
//       'any.only': 'Sort order must be either ASC or DESC'
//     })
//   })
// };
