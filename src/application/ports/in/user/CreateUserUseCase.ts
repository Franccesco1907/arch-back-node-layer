import type { CreateUserRequest, User } from '../../../domain/User';

export interface CreateUserUseCase {
  createUser(input: CreateUserRequest): Promise<User>;
}
