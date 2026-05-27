import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { ResponseFactory } from '../utils/response.factory';
import { TaskStatus, TaskPriority } from '../types';

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

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

      const result = await this.taskService.getAllTasks(
        { status: status as TaskStatus, assignee, priority: priority as TaskPriority },
        { page, limit },
      );

      const response = ResponseFactory.paginated(result.tasks, {
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
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
      const task = await this.taskService.createTask(req.body, req.user!.userId);
      const response = ResponseFactory.created(task);
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
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
      const task = await this.taskService.updateStatus(paramId(req), req.body.status, req.user!.userId);
      const response = ResponseFactory.success(task);
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };
}
