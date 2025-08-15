import { Request, Response, NextFunction } from 'express';
import { QueryFailedError } from 'typeorm';
import { AppError } from '../utils/error';

export interface CustomError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // TypeORM database errors
  if (error instanceof QueryFailedError) {
    // Duplicate key error
    if (
      error.message.includes('duplicate key') ||
      error.message.includes('UNIQUE constraint')
    ) {
      return res.status(409).json({
        status: 'error',
        message: 'Resource already exists',
        details:
          'A record with this information already exists in the database.',
      });
    }

    // Foreign key constraint error
    if (
      error.message.includes('foreign key constraint') ||
      error.message.includes('FOREIGN KEY constraint')
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid reference',
        details: 'The referenced resource does not exist.',
      });
    }

    // Generic database error
    return res.status(500).json({
      status: 'error',
      message: 'Database operation failed',
      details:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'An error occurred while processing your request.',
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
      details: 'The provided authentication token is invalid.',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired',
      details: 'The authentication token has expired. Please login again.',
    });
  }

  // Custom application errors
  const status = error.status || 500;
  const message = error.message || 'Internal server error';

  res.status(status).json({
    status: 'error',
    message,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};
