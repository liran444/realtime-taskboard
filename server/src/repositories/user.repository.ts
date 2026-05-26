import { BaseRepository } from './base.repository';
import type { User } from '../types';
import { User as UserModel } from '../models/user.model';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findOne({ email: email.toLowerCase() }).lean<User>().exec();
  }
}
