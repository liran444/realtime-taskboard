/**
 * Auto-seed for assignment/demo purposes only.
 *
 * On first startup (when the users collection is empty), this module
 * automatically creates default users so a reviewer can immediately log in
 * without running any manual scripts.
 *
 * NOTE: In a production application this would NOT exist — user creation would go
 *       through a proper registration flow or admin provisioning process.
 */
import { User } from '../models/user.model';
import { hashPassword } from '../utils/password.util';

const DEFAULT_USERS = [
  {
    email: 'admin@taskboard.com',
    password: 'admin123',
    displayName: 'Admin User',
    role: 'admin' as const,
  },
  {
    email: 'user1@taskboard.com',
    password: 'user123',
    displayName: 'John Doe',
    role: 'user' as const,
  },
  {
    email: 'user2@taskboard.com',
    password: 'user123',
    displayName: 'Jane Smith',
    role: 'user' as const,
  },
];

export async function autoSeed(): Promise<void> {
  const count = await User.countDocuments();
  if (count > 0) {
    return;
  }

  console.log('[auto-seed] No users found — seeding default users for demo...');

  for (const userData of DEFAULT_USERS) {
    const hashedPassword = await hashPassword(userData.password);
    await User.create({ ...userData, password: hashedPassword });
    console.log(`[auto-seed] Created: ${userData.email} (${userData.role})`);
  }

  console.log('[auto-seed] Done. Default credentials:');
  console.log('  admin@taskboard.com / admin123');
  console.log('  user1@taskboard.com / user123');
  console.log('  user2@taskboard.com / user123');
}
