import { FilterQuery } from 'mongoose';
import { BaseRepository } from './base.repository';
import { ITask, TaskStatus } from '../types';
import { Task } from '../models/task.model';

const USER_SUMMARY_FIELDS = 'displayName email';
const POPULATE_REFS = [
  { path: 'assignee', select: USER_SUMMARY_FIELDS },
  { path: 'createdBy', select: USER_SUMMARY_FIELDS },
  { path: 'lockedBy', select: USER_SUMMARY_FIELDS },
];

export class TaskRepository extends BaseRepository<ITask> {
  constructor() {
    super(Task);
  }

  async findAllPopulated(filter: FilterQuery<ITask> = {}): Promise<ITask[]> {
    return this.model
      .find(filter)
      .populate(POPULATE_REFS)
      .lean<ITask[]>()
      .exec();
  }

  async findByIdPopulated(id: string): Promise<ITask | null> {
    return this.model
      .findById(id)
      .populate(POPULATE_REFS)
      .lean<ITask>()
      .exec();
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
