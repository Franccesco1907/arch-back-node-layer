import { v4 as uuidv4 } from 'uuid';
import type { CreateUserRequest, User } from '../../../../application/domain/User';
import type { UserRepositoryPort } from '../../../../application/ports/out/persistence/UserRepositoryPort';

export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly store = new Map<string, User>();

  async createUser(input: CreateUserRequest): Promise<User> {
    const user: User = {
      id: uuidv4(),
      name: input.name,
      email: input.email,
      createdAt: new Date(),
    };

    this.store.set(user.id, user);
    return user;
  }
}
