import { BaseRepository } from './base.repository';
import { ITask, TaskStatus } from '../types';
import { Task } from '../models/task.model';

export class TaskRepository extends BaseRepository<ITask> {
  constructor() {
    super(Task);
  }

  async findByAssignee(userId: string): Promise<ITask[]> {
    return this.model.find({ assignee: userId }).lean<ITask[]>().exec();
  }

  async findByStatus(status: TaskStatus): Promise<ITask[]> {
    return this.model.find({ status }).lean<ITask[]>().exec();
  }

  async lockTask(taskId: string, userId: string): Promise<ITask | null> {
    return this.model
      .findByIdAndUpdate(
        taskId,
        { lockedBy: userId, lockedAt: new Date() },
        { new: true }
      )
      .lean<ITask>()
      .exec();
  }

  async unlockTask(taskId: string): Promise<ITask | null> {
    return this.model
      .findByIdAndUpdate(
        taskId,
        { $unset: { lockedBy: '', lockedAt: '' } },
        { new: true }
      )
      .lean<ITask>()
      .exec();
  }

  async unlockAllByUser(userId: string): Promise<void> {
    await this.model
      .updateMany(
        { lockedBy: userId },
        { $unset: { lockedBy: '', lockedAt: '' } }
      )
      .exec();
  }
}
