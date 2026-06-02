import { vi } from 'vitest';

// Mock AWS SDK clients globally
// Vitest 4: vi.fn() uses arrow functions internally; constructors must use function() syntax
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(function() {}),
  GetItemCommand: vi.fn(function() {}),
  PutItemCommand: vi.fn(function() {}),
  DeleteItemCommand: vi.fn(function() {})
}));

vi.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: vi.fn(function() {}),
  SendMessageCommand: vi.fn(function() {})
}));

vi.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: vi.fn(function() {}),
  GetSecretValueCommand: vi.fn(function() {})
}));

vi.mock('@aws-sdk/util-dynamodb', () => ({
  marshall: vi.fn(),
  unmarshall: vi.fn()
}));

// Mock axios globally
vi.mock('axios', () => ({
  default: vi.fn(),
  isAxiosError: vi.fn()
}));

// Set up environment variables for tests
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
// Don't set USERS_TABLE to force using InMemoryUserRepository in tests.
// DYNAMO_TABLE belongs to proxy configuration, not user persistence.
process.env.SQS_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
process.env.SECRET_MANAGER_ARN = 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret';
process.env.API_TIMEOUT = '30000';
