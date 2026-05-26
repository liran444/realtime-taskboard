import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { comparePassword } from '../utils/password.util';
import { environment } from '../config/environment';

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async login(email: string, password: string) {
    if (!email || !password) {
      const error = new Error('Email and password are required');
      (error as any).statusCode = 400;
      throw error;
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password');
      (error as any).statusCode = 401;
      throw error;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      (error as any).statusCode = 401;
      throw error;
    }

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, environment.jwtSecret, {
      expiresIn: environment.jwtExpiration as jwt.SignOptions['expiresIn'],
    });

    return {
      token,
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }
}
