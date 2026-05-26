import { Server } from 'socket.io';
import { TaskRepository } from '../repositories/task.repository';
import { ITask, TaskStatus, TaskPriority } from '../types';

export interface TaskFilters {
  status?: TaskStatus;
  assignee?: string;
  priority?: TaskPriority;
}

export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly io: Server,
  ) {}

  async getAllTasks(filters?: TaskFilters): Promise<ITask[]> {
    const query: Record<string, unknown> = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.assignee) query.assignee = filters.assignee;
    if (filters?.priority) query.priority = filters.priority;
    return this.taskRepository.findAllPopulated(query);
  }

  async getTaskById(id: string): Promise<ITask> {
    const task = await this.taskRepository.findByIdPopulated(id);
    if (!task) {
      const error = new Error('Task not found');
      (error as any).statusCode = 404;
      throw error;
    }
    return task;
  }

  async createTask(data: Partial<ITask>, userId: string): Promise<ITask> {
    const task = await this.taskRepository.create({
      ...data,
      createdBy: userId as any,
    });
    const populated = await this.taskRepository.findByIdPopulated(task._id.toString());
    this.io.to('tasks').emit('task:created', populated);
    return populated!;
  }

  async updateTask(id: string, data: Partial<ITask>, userId: string): Promise<ITask> {
    const existing = await this.taskRepository.findById(id);
    if (!existing) {
      const error = new Error('Task not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (existing.lockedBy && existing.lockedBy.toString() !== userId) {
      const error = new Error('Task is locked by another user');
      (error as any).statusCode = 403;
      throw error;
    }

    const { _id, createdBy, createdAt, updatedAt, lockedBy, lockedAt, ...updateFields } = data as any;
    await this.taskRepository.update(id, {
      $set: updateFields,
      $unset: { lockedBy: '', lockedAt: '' },
    });

    const populated = await this.taskRepository.findByIdPopulated(id);
    this.io.to('tasks').emit('task:updated', populated);
    return populated!;
  }

  async deleteTask(id: string, _userId: string): Promise<void> {
    const existing = await this.taskRepository.findById(id);
    if (!existing) {
      const error = new Error('Task not found');
      (error as any).statusCode = 404;
      throw error;
    }

    await this.taskRepository.delete(id);
    this.io.to('tasks').emit('task:deleted', { taskId: id });
  }

  async updateStatus(id: string, status: TaskStatus, _userId: string): Promise<ITask> {
    const existing = await this.taskRepository.findById(id);
    if (!existing) {
      const error = new Error('Task not found');
      (error as any).statusCode = 404;
      throw error;
    }

    await this.taskRepository.update(id, { status });
    const populated = await this.taskRepository.findByIdPopulated(id);
    this.io.to('tasks').emit('task:updated', populated);
    return populated!;
  }

  async lockTask(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepository.lockTask(taskId, userId);
    if (!task) {
      const error = new Error('Task not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const populated = await this.taskRepository.findByIdPopulated(taskId);
    const lockedByUser = populated?.lockedBy as any;
    this.io.to('tasks').emit('task:locked', {
      taskId,
      lockedBy: {
        userId,
        displayName: lockedByUser?.displayName || '',
      },
    });
  }

  async unlockTask(taskId: string, _userId: string): Promise<void> {
    const task = await this.taskRepository.unlockTask(taskId);
    if (!task) {
      const error = new Error('Task not found');
      (error as any).statusCode = 404;
      throw error;
    }

    this.io.to('tasks').emit('task:unlocked', { taskId });
  }

  async unlockAllByUser(userId: string): Promise<void> {
    const lockedTasks = await this.taskRepository.findAll({ lockedBy: userId } as any);
    await this.taskRepository.unlockAllByUser(userId);

    for (const task of lockedTasks) {
      this.io.to('tasks').emit('task:unlocked', { taskId: task._id.toString() });
    }
  }
}
