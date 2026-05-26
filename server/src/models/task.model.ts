import { Schema, model } from 'mongoose';
import type { Task as TaskDocument } from '../types';
import { TASK_STATUSES, TASK_PRIORITIES } from '../types';

const taskSchema = new Schema<TaskDocument>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'todo',
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'medium',
    },
    dueDate: {
      type: Date,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lockedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

taskSchema.index({ status: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });

export const Task = model<TaskDocument>('Task', taskSchema);
