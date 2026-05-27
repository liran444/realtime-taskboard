import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { validateCreateTask, validateUpdateTask, validateStatus } from '../middleware/validate-task.middleware';

export function createTaskRoutes(taskController: TaskController): Router {
  const router = Router();

  router.use(verifyToken);

  router.get('/', taskController.getAll);
  router.get('/:id', taskController.getById);
  router.post('/', validateCreateTask, taskController.create);
  router.put('/:id', validateUpdateTask, taskController.update);
  router.delete('/:id', taskController.remove);
  router.patch('/:id/status', validateStatus, taskController.updateStatus);

  return router;
}
