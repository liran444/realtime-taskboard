import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { environment } from '../config/environment';
import { ResponseFactory } from '../utils/response.factory';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response = ResponseFactory.error('Access denied. No token provided.', 401);
    res.status(response.statusCode).json(response);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, environment.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    const response = ResponseFactory.error('Invalid or expired token.', 401);
    res.status(response.statusCode).json(response);
  }
}
