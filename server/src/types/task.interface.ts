import { Types } from 'mongoose';

export const TASK_STATUSES = ['todo', 'in-progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  assignee?: Types.ObjectId;
  createdBy: Types.ObjectId;
  lockedBy?: Types.ObjectId;
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
