import { BaseRepository } from './base.repository';
import { IUser } from '../types';
import { User } from '../models/user.model';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({ email: email.toLowerCase() }).lean<IUser>().exec();
  }
}
