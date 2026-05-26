import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  router.post('/login', authController.login);

  return router;
}
