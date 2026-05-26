import dotenv from 'dotenv';

dotenv.config();

export const environment = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/taskboard',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  serverPort: parseInt(process.env.SERVER_PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};
