import type { CreateUserUseCase } from '../ports/in/user/CreateUserUseCase';
import type { UserRepositoryPort } from '../ports/out/persistence/UserRepositoryPort';
import type { CreateUserRequest, User } from '../domain/User';

export class UserService implements CreateUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async createUser(input: CreateUserRequest): Promise<User> {
    return this.userRepository.createUser(input);
  }
}
