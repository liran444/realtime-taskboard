import { Types } from 'mongoose';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ITask {
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
