import { FilterQuery } from 'mongoose';
import { BaseRepository } from './base.repository';
import type { Task } from '../types';
import { TaskStatus } from '../types';
import { Task as TaskModel } from '../models/task.model';

// Only project displayName + email when populating user refs — avoids
// leaking sensitive fields like password hashes to the client
const USER_SUMMARY_FIELDS = 'displayName email';
const POPULATE_REFS = [
  { path: 'assignee', select: USER_SUMMARY_FIELDS },
  { path: 'createdBy', select: USER_SUMMARY_FIELDS },
  { path: 'lockedBy', select: USER_SUMMARY_FIELDS },
];

export class TaskRepository extends BaseRepository<Task> {
  constructor() {
    super(TaskModel);
  }

  async findAllPopulated(filter: FilterQuery<Task> = {}): Promise<Task[]> {
    return this.model
      .find(filter)
      .populate(POPULATE_REFS)
      .lean<Task[]>()
      .exec();
  }

  // Runs the filtered query and count in parallel to avoid two sequential round trips
  async findPaginated(
    filter: FilterQuery<Task>,
    skip: number,
    limit: number,
  ): Promise<{ tasks: Task[]; total: number }> {
    const [tasks, total] = await Promise.all([
      this.model
        .find(filter)
        .populate(POPULATE_REFS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<Task[]>()
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { tasks, total };
  }

  async findByIdPopulated(id: string): Promise<Task | null> {
    return this.model
      .findById(id)
      .populate(POPULATE_REFS)
      .lean<Task>()
      .exec();
  }

  async findByAssignee(userId: string): Promise<Task[]> {
    return this.model.find({ assignee: userId }).lean<Task[]>().exec();
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return this.model.find({ status }).lean<Task[]>().exec();
  }

  async lockTask(taskId: string, userId: string): Promise<Task | null> {
    return this.model
      .findByIdAndUpdate(
        taskId,
        { lockedBy: userId, lockedAt: new Date() },
        { new: true }
      )
      .lean<Task>()
      .exec();
  }

  // $unset removes the fields entirely rather than setting them to null,
  // keeping the document clean and making "is locked?" queries simpler
  async unlockTask(taskId: string): Promise<Task | null> {
    return this.model
      .findByIdAndUpdate(
        taskId,
        { $unset: { lockedBy: '', lockedAt: '' } },
        { new: true }
      )
      .lean<Task>()
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
