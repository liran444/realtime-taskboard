import { Types } from 'mongoose';

export type UserRole = 'admin' | 'user';

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
