import { vi } from 'vitest';

// DynamoDB Mock
export const mockDynamoDBClient = {
  send: vi.fn(),
  destroy: vi.fn(),
};

export const createDynamoDBMocks = () => ({
  GetCommand: vi.fn(),
  PutCommand: vi.fn(),
  UpdateCommand: vi.fn(),
  DeleteCommand: vi.fn(),
  QueryCommand: vi.fn(),
  ScanCommand: vi.fn(),
});

// SQS Mock
export const mockSQSClient = {
  send: vi.fn(),
  destroy: vi.fn(),
};

export const createSQSMocks = () => ({
  SendMessageCommand: vi.fn(),
  ReceiveMessageCommand: vi.fn(),
  DeleteMessageCommand: vi.fn(),
  GetQueueUrlCommand: vi.fn(),
});

// Secrets Manager Mock
export const mockSecretsManagerClient = {
  send: vi.fn(),
  destroy: vi.fn(),
};

export const createSecretsManagerMocks = () => ({
  GetSecretValueCommand: vi.fn(),
  CreateSecretCommand: vi.fn(),
  UpdateSecretCommand: vi.fn(),
  DeleteSecretCommand: vi.fn(),
});

// Lambda Context Mock
export const createMockLambdaContext = () => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2023/01/01/[$LATEST]test-stream',
  getRemainingTimeInMillis: vi.fn(() => 30000),
  done: vi.fn(),
  fail: vi.fn(),
  succeed: vi.fn(),
});

// API Gateway Event Mock
export const createMockAPIGatewayEvent = (overrides: any = {}) => ({
  httpMethod: 'GET',
  path: '/test',
  pathParameters: null,
  queryStringParameters: null,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'test-agent',
  },
  multiValueHeaders: {},
  body: null,
  isBase64Encoded: false,
  requestContext: {
    accountId: '123456789012',
    apiId: 'test-api-id',
    protocol: 'HTTP/1.1',
    httpMethod: 'GET',
    path: '/test',
    stage: 'test',
    requestId: 'test-request-id',
    requestTime: '01/Jan/2023:00:00:00 +0000',
    requestTimeEpoch: 1672531200000,
    identity: {
      cognitoIdentityPoolId: null,
      accountId: null,
      cognitoIdentityId: null,
      caller: null,
      sourceIp: '127.0.0.1',
      principalOrgId: null,
      accessKey: null,
      cognitoAuthenticationType: null,
      cognitoAuthenticationProvider: null,
      userArn: null,
      userAgent: 'test-agent',
      user: null,
    },
    authorizer: null,
  },
  stageVariables: null,
  resource: '/test',
  ...overrides,
});

// AWS SDK Mock Factory
export const createAWSMockFactory = () => {
  const mocks = {
    DynamoDBClient: vi.fn(() => mockDynamoDBClient),
    SQSClient: vi.fn(() => mockSQSClient),
    SecretsManagerClient: vi.fn(() => mockSecretsManagerClient),
    ...createDynamoDBMocks(),
    ...createSQSMocks(),
    ...createSecretsManagerMocks(),
  };

  return {
    mocks,
    resetAllMocks: () => {
      Object.values(mocks).forEach(mock => {
        if (typeof mock === 'function' && 'mockReset' in mock) {
          mock.mockReset();
        }
      });
    },
    clearAllMocks: () => {
      Object.values(mocks).forEach(mock => {
        if (typeof mock === 'function' && 'mockClear' in mock) {
          mock.mockClear();
        }
      });
    },
  };
};

// Environment Variables Mock
export const mockEnvironmentVariables = (envVars: Record<string, string>) => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv, ...envVars };
  });

  afterEach(() => {
    process.env = originalEnv;
  });
};

// Common AWS Response Patterns
export const createSuccessResponse = (data: any) => ({
  $metadata: {
    httpStatusCode: 200,
    requestId: 'test-request-id',
    extendedRequestId: 'test-extended-id',
    cfId: 'test-cf-id',
    attempts: 1,
    totalRetryDelay: 0,
  },
  ...data,
});

export const createErrorResponse = (errorCode: string, message: string) => {
  const error = new Error(message);
  (error as any).name = errorCode;
  (error as any).$metadata = {
    httpStatusCode: 400,
    requestId: 'test-request-id',
  };
  return error;
};