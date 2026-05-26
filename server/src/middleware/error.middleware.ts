import { Request, Response, NextFunction } from 'express';
import { ResponseFactory } from '../utils/response.factory';
import { environment } from '../config/environment';

/**
 * Global Express error handler — must be the last middleware registered.
 * Maps Mongoose-specific errors (ValidationError, CastError, duplicate key)
 * to meaningful HTTP status codes before falling back to the generic handler.
 */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  if (environment.nodeEnv === 'development') {
    console.error('[Error]', err);
  }

  if (err.name === 'ValidationError') {
    const response = ResponseFactory.error(err.message, 400);
    res.status(response.statusCode).json(response);
    return;
  }

  if (err.name === 'CastError') {
    const response = ResponseFactory.error('Invalid ID format.', 400);
    res.status(response.statusCode).json(response);
    return;
  }

  if (err.code === 11000) {
    const response = ResponseFactory.error('Duplicate key error.', 409);
    res.status(response.statusCode).json(response);
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const response = ResponseFactory.error(message, statusCode);
  res.status(response.statusCode).json(response);
}
