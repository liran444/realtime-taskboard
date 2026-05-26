import { Schema, model } from 'mongoose';
import { ITask } from '../types';

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
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

export const Task = model<ITask>('Task', taskSchema);
