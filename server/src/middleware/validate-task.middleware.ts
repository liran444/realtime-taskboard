/**
 * Task validation middleware.
 * Mirrors the frontend form rules so invalid data is rejected even if the
 * client is bypassed (e.g. via curl). Runs before the controller in the
 * route chain, same pattern as verifyToken.
 */
import { Request, Response, NextFunction } from 'express';
import { ResponseFactory } from '../utils/response.factory';
import { TASK_STATUSES, TASK_PRIORITIES } from '../types';

function validationError(res: Response, message: string): void {
  const response = ResponseFactory.error(message, 400);
  res.status(400).json(response);
}

function validateSharedFields(res: Response, { description, status, priority }: Record<string, any>): boolean {
  if (description && description.trim().length > 500) {
    validationError(res, 'Description cannot exceed 500 characters');
    return false;
  }
  if (status && !TASK_STATUSES.includes(status)) {
    validationError(res, `Invalid status. Must be one of: ${TASK_STATUSES.join(', ')}`);
    return false;
  }
  if (priority && !TASK_PRIORITIES.includes(priority)) {
    validationError(res, `Invalid priority. Must be one of: ${TASK_PRIORITIES.join(', ')}`);
    return false;
  }
  return true;
}

export function validateCreateTask(req: Request, res: Response, next: NextFunction): void {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    validationError(res, 'Title is required');
    return;
  }
  if (title.trim().length > 100) {
    validationError(res, 'Title cannot exceed 100 characters');
    return;
  }
  if (!validateSharedFields(res, req.body)) return;

  next();
}

export function validateUpdateTask(req: Request, res: Response, next: NextFunction): void {
  const { title } = req.body;

  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    validationError(res, 'Title cannot be empty');
    return;
  }
  if (title && title.trim().length > 100) {
    validationError(res, 'Title cannot exceed 100 characters');
    return;
  }
  if (!validateSharedFields(res, req.body)) return;

  next();
}

export function validateStatus(req: Request, res: Response, next: NextFunction): void {
  const { status } = req.body;

  if (!status || !TASK_STATUSES.includes(status)) {
    validationError(res, `Invalid status. Must be one of: ${TASK_STATUSES.join(', ')}`);
    return;
  }

  next();
}
