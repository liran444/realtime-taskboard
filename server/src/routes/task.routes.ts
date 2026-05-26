import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { verifyToken } from '../middleware/auth.middleware';

export function createTaskRoutes(taskController: TaskController): Router {
  const router = Router();

  router.use(verifyToken);

  router.get('/', taskController.getAll);
  router.get('/:id', taskController.getById);
  router.post('/', taskController.create);
  router.put('/:id', taskController.update);
  router.delete('/:id', taskController.remove);
  router.patch('/:id/status', taskController.updateStatus);

  return router;
}
