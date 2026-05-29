import type { CreateUserRequest, User } from '../../../domain/User';

export interface UserRepositoryPort {
  createUser(input: CreateUserRequest): Promise<User>;
}
