// User Test Data
export const TEST_USERS = {
  valid: {
    id: 'test-user-123',
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 30,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  withoutId: {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    age: 25,
  },
  invalid: {
    id: '',
    name: '',
    email: 'invalid-email',
    age: -1,
  },
  minimal: {
    name: 'Minimal User',
    email: 'minimal@example.com',
  },
};

// Request Test Data
export const TEST_REQUESTS = {
  createUser: {
    valid: {
      body: JSON.stringify(TEST_USERS.withoutId),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    invalid: {
      body: JSON.stringify(TEST_USERS.invalid),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    malformed: {
      body: '{ invalid json',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  },
  getUser: {
    valid: {
      pathParameters: {
        id: TEST_USERS.valid.id,
      },
    },
    invalid: {
      pathParameters: {
        id: 'invalid-id',
      },
    },
    missing: {
      pathParameters: null,
    },
  },
};

// Response Test Data
export const TEST_RESPONSES = {
  success: {
    user: {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: TEST_USERS.valid,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    created: {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        data: TEST_USERS.valid,
        message: 'User created successfully',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    health: {
      statusCode: 200,
      body: JSON.stringify({
        status: 'healthy',
        timestamp: '2023-01-01T00:00:00.000Z',
        version: '1.0.0',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  },
  error: {
    badRequest: {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: 'Bad Request',
        message: 'Invalid input data',
        details: ['Name is required', 'Email must be valid'],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    notFound: {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: 'Not Found',
        message: 'User not found',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    internalError: {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  },
};

// AWS Test Data
export const TEST_AWS_DATA = {
  dynamodb: {
    item: {
      id: { S: TEST_USERS.valid.id },
      name: { S: TEST_USERS.valid.name },
      email: { S: TEST_USERS.valid.email },
      age: { N: TEST_USERS.valid.age.toString() },
      createdAt: { S: TEST_USERS.valid.createdAt },
      updatedAt: { S: TEST_USERS.valid.updatedAt },
    },
    response: {
      Item: {
        id: { S: TEST_USERS.valid.id },
        name: { S: TEST_USERS.valid.name },
        email: { S: TEST_USERS.valid.email },
        age: { N: TEST_USERS.valid.age.toString() },
        createdAt: { S: TEST_USERS.valid.createdAt },
        updatedAt: { S: TEST_USERS.valid.updatedAt },
      },
    },
  },
  sqs: {
    message: {
      MessageId: 'test-message-id',
      ReceiptHandle: 'test-receipt-handle',
      Body: JSON.stringify({
        userId: TEST_USERS.valid.id,
        action: 'user-created',
        timestamp: '2023-01-01T00:00:00.000Z',
      }),
      Attributes: {
        SentTimestamp: '1672531200000',
        ApproximateReceiveCount: '1',
      },
    },
    sendResponse: {
      MessageId: 'test-message-id',
      MD5OfBody: 'test-md5-hash',
    },
  },
  secretsManager: {
    secret: {
      SecretString: JSON.stringify({
        dbHost: 'localhost',
        dbPort: 5432,
        dbName: 'testdb',
        dbUser: 'testuser',
        dbPassword: 'testpass',
      }),
      VersionId: 'test-version-id',
      VersionStages: ['AWSCURRENT'],
    },
  },
};

// Environment Test Data
export const TEST_ENVIRONMENT = {
  development: {
    NODE_ENV: 'development',
    AWS_REGION: 'us-east-1',
    DYNAMODB_TABLE_NAME: 'test-users-table',
    SQS_QUEUE_URL: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
    SECRET_NAME: 'test/database/credentials',
    LOG_LEVEL: 'debug',
  },
  test: {
    NODE_ENV: 'test',
    AWS_REGION: 'us-east-1',
    DYNAMODB_TABLE_NAME: 'test-users-table',
    SQS_QUEUE_URL: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
    SECRET_NAME: 'test/database/credentials',
    LOG_LEVEL: 'error',
  },
  production: {
    NODE_ENV: 'production',
    AWS_REGION: 'us-east-1',
    DYNAMODB_TABLE_NAME: 'prod-users-table',
    SQS_QUEUE_URL: 'https://sqs.us-east-1.amazonaws.com/123456789012/prod-queue',
    SECRET_NAME: 'prod/database/credentials',
    LOG_LEVEL: 'info',
  },
};

// Performance Test Data
export const TEST_PERFORMANCE = {
  loadTest: {
    concurrent: 10,
    requests: 100,
    duration: 30000, // 30 seconds
  },
  stressTest: {
    concurrent: 50,
    requests: 1000,
    duration: 60000, // 1 minute
  },
  enduranceTest: {
    concurrent: 5,
    requests: 10000,
    duration: 300000, // 5 minutes
  },
};

// Contract Test Data
export const TEST_CONTRACTS = {
  userService: {
    provider: 'user-service',
    consumer: 'api-gateway',
    interactions: [
      {
        description: 'get user by id',
        request: {
          method: 'GET',
          path: '/users/123',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        response: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: TEST_USERS.valid,
        },
      },
    ],
  },
};

// Architecture Test Data
export const TEST_ARCHITECTURE = {
  layers: {
    adapter: ['adapter/in', 'adapter/out'],
    application: ['application/services', 'application/ports'],
    domain: ['domain/entities', 'domain/value-objects'],
    infrastructure: ['infrastructure/persistence', 'infrastructure/messaging'],
  },
  dependencies: {
    allowed: [
      'adapter -> application',
      'application -> domain',
      'infrastructure -> domain',
    ],
    forbidden: [
      'domain -> application',
      'domain -> adapter',
      'domain -> infrastructure',
    ],
  },
};