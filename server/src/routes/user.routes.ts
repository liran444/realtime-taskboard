import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { verifyToken } from '../middleware/auth.middleware';

export function createUserRoutes(userController: UserController): Router {
  const router = Router();

  router.use(verifyToken);

  router.get('/', userController.getAll);

  return router;
}
