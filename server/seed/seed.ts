/**
 * Manual seed for assignment/demo purposes only.
 * Seeds the users collection with the default users.
 * Usage: docker compose exec server npx tsx seed/seed.ts
 */
import mongoose from 'mongoose';
import { environment } from '../src/config/environment';
import { User } from '../src/models/user.model';
import { hashPassword } from '../src/utils/password.util';

const users = [
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

async function seed(): Promise<void> {
  try {
    await mongoose.connect(environment.mongoUri);
    console.log('Connected to MongoDB');

    await User.collection.drop().catch(() => {
      console.log('Users collection does not exist yet, skipping drop');
    });
    console.log('Dropped users collection');

    for (const userData of users) {
      const hashedPassword = await hashPassword(userData.password);
      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });
      console.log(`Created user: ${user.email} (${user.role})`);
    }

    console.log('\nSeed completed successfully');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();
