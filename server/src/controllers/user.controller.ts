import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { ResponseFactory } from '../utils/response.factory';

export class UserController {
  constructor(private readonly userService: UserService) {}

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.getAllUsers();
      const response = ResponseFactory.success(users);
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };
}
