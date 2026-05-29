import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import type { CreateUserRequest, User } from '../../../../application/domain/User';
import type { UserRepositoryPort } from '../../../../application/ports/out/persistence/UserRepositoryPort';

export class DynamoUserRepository implements UserRepositoryPort {
  private readonly client: DynamoDBClient;

  constructor(
    private readonly tableName: string,
    region: string
  ) {
    this.client = new DynamoDBClient({ region });
  }

  static fromEnv(): DynamoUserRepository {
    return new DynamoUserRepository(
      process.env.USERS_TABLE || 'users',
      process.env.AWS_REGION || 'us-east-1'
    );
  }

  async createUser(input: CreateUserRequest): Promise<User> {
    const user: User = {
      id: uuidv4(),
      name: input.name,
      email: input.email,
      createdAt: new Date(),
    };

    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: marshall({
        ...user,
        createdAt: user.createdAt?.toISOString(),
      }),
    });

    await this.client.send(command);
    return user;
  }
}
