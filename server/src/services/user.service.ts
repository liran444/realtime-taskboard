import { UserRepository } from '../repositories/user.repository';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getAllUsers() {
    const users = await this.userRepository.findAll();
    return users.map(({ _id, email, displayName, role }) => ({
      _id,
      email,
      displayName,
      role,
    }));
  }
}
