import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { environment } from '../config/environment';
import { JwtPayload } from '../middleware/auth.middleware';
import { TaskService } from '../services/task.service';
import { TaskRepository } from '../repositories/task.repository';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

// Singleton — initialized once in app.ts and reused for all broadcasting
let io: Server;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket-level auth middleware: verifies the JWT passed via handshake before
  // allowing the connection. Rejects unauthenticated clients at the transport level.
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

const LOCK_EXPIRY_MS = 5 * 60 * 1000;
const LOCK_CHECK_INTERVAL_MS = 60 * 1000;

/**
 * Periodic cleanup for stale task locks.
 *
 * When a user locks a task (by opening the edit dialog) but never releases it
 * (e.g. browser crash, network drop without clean disconnect), the lock would
 * persist indefinitely. This interval scans for locks older than 5 minutes,
 * clears them, and broadcasts 'task:unlocked' so all clients update their UI.
 */
export function startLockExpiryCleanup(taskRepository: TaskRepository): void {
  setInterval(async () => {
    try {
      const expiryThreshold = new Date(Date.now() - LOCK_EXPIRY_MS);
      const staleTasks = await taskRepository.findAll({
        lockedBy: { $ne: null },
        lockedAt: { $lt: expiryThreshold },
      } as any);

      for (const task of staleTasks) {
        await taskRepository.unlockTask(task._id.toString());
        io.to('tasks').emit('task:unlocked', { taskId: task._id.toString() });
      }

      if (staleTasks.length > 0) {
        console.log(`[lock-cleanup] Expired ${staleTasks.length} stale lock(s)`);
      }
    } catch (error) {
      console.error('[lock-cleanup] Error:', (error as Error).message);
    }
  }, LOCK_CHECK_INTERVAL_MS);
}

export function setupSocketHandlers(taskService: TaskService): void {
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    console.log(`Socket connected: ${socket.id} (user: ${userId})`);

    // All clients join a single 'tasks' room — broadcasts go to everyone
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

    // Release all locks held by this user on disconnect (browser close, network drop, logout)
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
