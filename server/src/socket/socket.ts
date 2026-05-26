import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { environment } from '../config/environment';
import { JwtPayload } from '../middleware/auth.middleware';
import { TaskService } from '../services/task.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: Server;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, environment.jwtSecret) as JwtPayload;
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

export function setupSocketHandlers(taskService: TaskService): void {
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    console.log(`Socket connected: ${socket.id} (user: ${userId})`);

    socket.join('tasks');

    socket.on('task:lock', async (taskId: string) => {
      try {
        await taskService.lockTask(taskId, userId);
      } catch (error) {
        socket.emit('error', { message: (error as Error).message });
      }
    });

    socket.on('task:unlock', async (taskId: string) => {
      try {
        await taskService.unlockTask(taskId, userId);
      } catch (error) {
        socket.emit('error', { message: (error as Error).message });
      }
    });

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id} (user: ${userId})`);
      try {
        await taskService.unlockAllByUser(userId);
      } catch (error) {
        console.error('Error unlocking tasks on disconnect:', (error as Error).message);
      }
    });
  });
}
