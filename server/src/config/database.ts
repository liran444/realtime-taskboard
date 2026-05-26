import mongoose from 'mongoose';
import { environment } from './environment';

// Singleton guard — prevents multiple connections if called more than once
let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(environment.mongoUri);
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}
