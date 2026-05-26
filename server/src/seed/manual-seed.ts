/**
 * Manual seed for assignment/demo purposes only.
 *
 * Drops and re-seeds the users collection with the default users.
 * Usage: docker compose exec server npm run seed
 *
 * NOTE: In a production application this would NOT exist — user creation would go
 *       through a proper registration flow or admin provisioning process.
 */
import mongoose from 'mongoose';
import { environment } from '../config/environment';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/password.util';
import { DEFAULT_USERS } from './default-users';

export async function manualSeed(): Promise<void> {
  await mongoose.connect(environment.mongoUri);
  console.log('Connected to MongoDB');

  await User.collection.drop().catch(() => {
    console.log('Users collection does not exist yet, skipping drop');
  });
  console.log('Dropped users collection');

  for (const userData of DEFAULT_USERS) {
    const hashedPassword = await hashPassword(userData.password);
    const user = await User.create({
      ...userData,
      password: hashedPassword,
    });
    console.log(`Created user: ${user.email} (${user.role})`);
  }

  console.log('\nSeed completed successfully');
}

async function run(): Promise<void> {
  try {
    await manualSeed();
  } catch (error) {
    console.error('Seed error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

run();
