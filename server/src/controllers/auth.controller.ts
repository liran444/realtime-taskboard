import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ResponseFactory } from '../utils/response.factory';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      const response = ResponseFactory.success(result);
      res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };
}
