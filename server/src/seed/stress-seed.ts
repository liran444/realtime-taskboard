/**
 * Stress-test seed — inserts tasks with randomized data.
 *
 * Accepts an optional count argument (defaults to 500).
 * Requires users to already exist in the DB (run manual-seed first if needed).
 * Usage: docker compose exec server npm run seed:stress [-- <count>]
 */
import mongoose from 'mongoose';
import { environment } from '../config/environment';
import { User } from '../models/user.model';
import { Task } from '../models/task.model';
import { TASK_STATUSES, TASK_PRIORITIES } from '../types';

const DEFAULT_COUNT = 500;
const TASK_COUNT = parseCount(process.argv[2]);

function parseCount(arg: string | undefined): number {
  if (!arg) return DEFAULT_COUNT;
  const n = parseInt(arg, 10);
  if (isNaN(n) || n < 1) {
    console.warn(`Invalid count "${arg}", using default (${DEFAULT_COUNT})`);
    return DEFAULT_COUNT;
  }
  return n;
}

const TITLES = [
  'Fix login redirect', 'Update dashboard layout', 'Add user avatar upload',
  'Refactor API error handling', 'Write unit tests for auth', 'Optimize DB queries',
  'Add pagination to task list', 'Implement dark mode', 'Fix mobile responsive issues',
  'Add email notifications', 'Create admin panel', 'Update dependencies',
  'Add search functionality', 'Fix date picker timezone bug', 'Improve loading states',
  'Add bulk delete feature', 'Configure CI/CD pipeline', 'Add rate limiting',
  'Create API documentation', 'Fix memory leak in socket handler',
  'Add task export to CSV', 'Implement undo/redo', 'Add keyboard shortcuts',
  'Fix broken image fallback', 'Add drag-and-drop reorder',
];

const DESCRIPTIONS = [
  'This needs to be addressed before the next release.',
  'Low priority but would improve the user experience significantly.',
  'Reported by QA team during regression testing.',
  'Blocking other tasks — should be prioritized.',
  'Nice to have. Can be deferred if needed.',
  '',
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFutureDate(): Date | undefined {
  if (Math.random() < 0.3) return undefined;
  const days = Math.floor(Math.random() * 60) - 10;
  return new Date(Date.now() + days * 86_400_000);
}

async function stressSeed(): Promise<void> {
  await mongoose.connect(environment.mongoUri);
  console.log('Connected to MongoDB');

  const users = await User.find().lean();
  if (users.length === 0) {
    console.error('No users found — run `npm run seed` first to create users.');
    process.exitCode = 1;
    return;
  }

  const userIds = users.map(u => u._id);
  console.log(`Found ${users.length} user(s). Generating ${TASK_COUNT} tasks...`);

  const tasks = Array.from({ length: TASK_COUNT }, (_, i) => ({
    title: `${pick(TITLES)} (#${i + 1})`,
    description: pick(DESCRIPTIONS),
    status: pick(TASK_STATUSES),
    priority: pick(TASK_PRIORITIES),
    dueDate: randomFutureDate(),
    assignee: Math.random() < 0.2 ? undefined : pick(userIds),
    createdBy: pick(userIds),
  }));

  await Task.insertMany(tasks);
  console.log(`Inserted ${TASK_COUNT} tasks successfully`);
}

async function run(): Promise<void> {
  try {
    await stressSeed();
  } catch (error) {
    console.error('Stress seed error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

run();
