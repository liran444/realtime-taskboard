import express from 'express';
import http from 'http';
import cors from 'cors';
import { environment } from './config/environment';
import { connectDatabase } from './config/database';
import { autoSeed } from './seed/auto-seed';
import { UserRepository } from './repositories/user.repository';
import { TaskRepository } from './repositories/task.repository';
import { AuthService } from './services/auth.service';
import { TaskService } from './services/task.service';
import { AuthController } from './controllers/auth.controller';
import { TaskController } from './controllers/task.controller';
import { createAuthRoutes } from './routes/auth.routes';
import { createTaskRoutes } from './routes/task.routes';
import { initializeSocket, setupSocketHandlers } from './socket/socket';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

const io = initializeSocket(server);

const userRepository = new UserRepository();
const taskRepository = new TaskRepository();
const authService = new AuthService(userRepository);
const taskService = new TaskService(taskRepository, io);
const authController = new AuthController(authService);
const taskController = new TaskController(taskService);

app.use('/api/auth', createAuthRoutes(authController));
app.use('/api/tasks', createTaskRoutes(taskController));

app.use(errorHandler);

setupSocketHandlers(taskService);

connectDatabase().then(async () => {
  await autoSeed();
  server.listen(environment.serverPort, '0.0.0.0', () => {
    console.log(`Server running on port ${environment.serverPort} [${environment.nodeEnv}]`);
  });
});
