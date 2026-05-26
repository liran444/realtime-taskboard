import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { ResponseFactory } from '../utils/response.factory';
import { TaskStatus, TaskPriority, TASK_STATUSES, TASK_PRIORITIES } from '../types';

function paramId(req: Request): string {
  return req.params.id as string;
}

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string | undefined;
      const assignee = req.query.assignee as string | undefined;
      const priority = req.query.priority as string | undefined;
      const tasks = await this.taskService.getAllTasks({
        status: status as TaskStatus,
        assignee,
        priority: priority as TaskPriority,
      });
      const response = ResponseFactory.success(tasks);
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await this.taskService.getTaskById(paramId(req));
      const response = ResponseFactory.success(task);
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description, status, priority } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        const response = ResponseFactory.error('Title is required', 400);
        res.status(response.statusCode).json(response);
        return;
      }
      if (title.trim().length > 100) {
        const response = ResponseFactory.error('Title cannot exceed 100 characters', 400);
        res.status(response.statusCode).json(response);
        return;
      }
      if (description && description.trim().length > 500) {
        const response = ResponseFactory.error('Description cannot exceed 500 characters', 400);
        res.status(response.statusCode).json(response);
        return;
      }
      if (status && !TASK_STATUSES.includes(status)) {
        const response = ResponseFactory.error(
          `Invalid status. Must be one of: ${TASK_STATUSES.join(', ')}`, 400,
        );
        res.status(response.statusCode).json(response);
        return;
      }
      if (priority && !TASK_PRIORITIES.includes(priority)) {
        const response = ResponseFactory.error(
          `Invalid priority. Must be one of: ${TASK_PRIORITIES.join(', ')}`, 400,
        );
        res.status(response.statusCode).json(response);
        return;
      }

      const task = await this.taskService.createTask(req.body, req.user!.userId);
      const response = ResponseFactory.created(task);
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description, status, priority } = req.body;

      if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
        const response = ResponseFactory.error('Title cannot be empty', 400);
        res.status(response.statusCode).json(response);
        return;
      }
      if (title && title.trim().length > 100) {
        const response = ResponseFactory.error('Title cannot exceed 100 characters', 400);
        res.status(response.statusCode).json(response);
        return;
      }
      if (description && description.trim().length > 500) {
        const response = ResponseFactory.error('Description cannot exceed 500 characters', 400);
        res.status(response.statusCode).json(response);
        return;
      }
      if (status && !TASK_STATUSES.includes(status)) {
        const response = ResponseFactory.error(
          `Invalid status. Must be one of: ${TASK_STATUSES.join(', ')}`, 400,
        );
        res.status(response.statusCode).json(response);
        return;
      }
      if (priority && !TASK_PRIORITIES.includes(priority)) {
        const response = ResponseFactory.error(
          `Invalid priority. Must be one of: ${TASK_PRIORITIES.join(', ')}`, 400,
        );
        res.status(response.statusCode).json(response);
        return;
      }

      const task = await this.taskService.updateTask(paramId(req), req.body, req.user!.userId);
      const response = ResponseFactory.success(task);
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.taskService.deleteTask(paramId(req), req.user!.userId);
      const response = ResponseFactory.success({ message: 'Task deleted successfully' });
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;

      if (!status || !TASK_STATUSES.includes(status)) {
        const response = ResponseFactory.error(
          `Invalid status. Must be one of: ${TASK_STATUSES.join(', ')}`, 400,
        );
        res.status(response.statusCode).json(response);
        return;
      }

      const task = await this.taskService.updateStatus(paramId(req), status, req.user!.userId);
      const response = ResponseFactory.success(task);
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };
}
