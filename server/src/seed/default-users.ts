import type { UserRole } from '../types';

export interface DefaultUserSeed {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

export const DEFAULT_USERS: DefaultUserSeed[] = [
  {
    email: 'admin@taskboard.com',
    password: 'admin123',
    displayName: 'Admin User',
    role: 'admin',
  },
  {
    email: 'user1@taskboard.com',
    password: 'user123',
    displayName: 'John Doe',
    role: 'user',
  },
  {
    email: 'user2@taskboard.com',
    password: 'user123',
    displayName: 'Jane Smith',
    role: 'user',
  },
];
