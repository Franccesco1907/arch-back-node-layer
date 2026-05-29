import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { ProxyLambdaHandler } from '../../../../src/adapter/in/lambda/ProxyLambdaHandler';
import type { ExecuteRequestUseCase } from '../../../../src/application/ports/in/execute/ExecuteRequestUseCase';
import { HttpMethodType } from '../../../../src/application/domain/ProxyRequest';
import type { ProxyRequest, ProxyResponse } from '../../../../src/application/domain/ProxyRequest';
import { ProxyLambdaException } from '../../../../src/application/exceptions/ProxyLambdaException';

describe('ProxyLambdaHandler', () => {
  let proxyLambdaHandler: ProxyLambdaHandler;
  let mockExecuteRequestUseCase: ExecuteRequestUseCase;

  const mockEvent: APIGatewayProxyEvent = {
    httpMethod: 'GET',
    path: '/test',
    headers: { 'Content-Type': 'application/json' },
    queryStringParameters: { param1: 'value1' },
    pathParameters: { id: '123' },
    body: '{"test": "data"}',
    requestContext: {
      requestId: 'test-request-id',
      accountId: 'test-account',
      apiId: 'test-api',
      stage: 'test',
      requestTime: '2023-01-01T00:00:00Z',
      requestTimeEpoch: 1672531200000,
      identity: {
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent'
      },
      httpMethod: 'GET',
      resourcePath: '/test',
      protocol: 'HTTP/1.1',
      resourceId: 'test-resource'
    } as APIGatewayProxyEvent['requestContext'],
    resource: '/test',
    stageVariables: null,
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null
  };

  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-aws-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2023/01/01/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: vi.fn(),
    fail: vi.fn(),
    succeed: vi.fn()
  };

  beforeEach(() => {
    mockExecuteRequestUseCase = {
      execute: vi.fn()
    };
    proxyLambdaHandler = new ProxyLambdaHandler(mockExecuteRequestUseCase);
  });

  it('should handle request successfully', async () => {
    // Given
    const mockResponse: ProxyResponse = {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'success' },
      fullEndpoint: 'https://api.example.com/test'
    };

    vi.mocked(mockExecuteRequestUseCase.execute).mockResolvedValue(mockResponse);

    // When
    const result = await proxyLambdaHandler.handleRequest(mockEvent, mockContext);

    // Then
    expect(result).toEqual({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'success' })
    });

    expect(mockExecuteRequestUseCase.execute).toHaveBeenCalledWith({
      id: '123',
      operation: 'GET',
      method: HttpMethodType.GET,
      path: '/test',
      queryParameters: { param1: 'value1' },
      headers: { 'Content-Type': 'application/json' },
      body: '{"test": "data"}',
      pathParameters: { id: '123' }
    });
  });

  it('should handle ProxyLambdaException', async () => {
    // Given
    const error = new ProxyLambdaException('Test error', 400);
    vi.mocked(mockExecuteRequestUseCase.execute).mockRejectedValue(error);

    // When
    const result = await proxyLambdaHandler.handleRequest(mockEvent, mockContext);

    // Then
    expect(result).toEqual({
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Test error' })
    });
  });

  it('should handle generic error', async () => {
    // Given
    const error = new Error('Generic error');
    vi.mocked(mockExecuteRequestUseCase.execute).mockRejectedValue(error);

    // When
    const result = await proxyLambdaHandler.handleRequest(mockEvent, mockContext);

    // Then
    expect(result).toEqual({
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    });
  });

  it('should map event to ProxyRequest correctly', async () => {
    // Given
    const mockResponse: ProxyResponse = {
      statusCode: 200,
      headers: {},
      body: {},
      fullEndpoint: 'test'
    };

    vi.mocked(mockExecuteRequestUseCase.execute).mockResolvedValue(mockResponse);

    // When
    await proxyLambdaHandler.handleRequest(mockEvent, mockContext);

    // Then
    const expectedProxyRequest: ProxyRequest = {
      id: '123',
      operation: 'GET',
      method: HttpMethodType.GET,
      path: '/test',
      queryParameters: { param1: 'value1' },
      headers: { 'Content-Type': 'application/json' },
      body: '{"test": "data"}',
      pathParameters: { id: '123' }
    };

    expect(mockExecuteRequestUseCase.execute).toHaveBeenCalledWith(expectedProxyRequest);
  });

  it('should resolve proxy config id from x-proxy-config-id header when path id is absent', async () => {
    const mockResponse: ProxyResponse = {
      statusCode: 200,
      headers: {},
      body: {},
      fullEndpoint: 'test'
    };
    const eventWithoutPathId: APIGatewayProxyEvent = {
      ...mockEvent,
      path: '/orders/123',
      headers: { 'x-proxy-config-id': 'header-config' },
      pathParameters: null
    };

    vi.mocked(mockExecuteRequestUseCase.execute).mockResolvedValue(mockResponse);

    await proxyLambdaHandler.handleRequest(eventWithoutPathId, mockContext);

    expect(mockExecuteRequestUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'header-config' })
    );
  });

  it('should resolve proxy config id from the first path segment before falling back to resource', async () => {
    const mockResponse: ProxyResponse = {
      statusCode: 200,
      headers: {},
      body: {},
      fullEndpoint: 'test'
    };
    const eventWithoutExplicitId: APIGatewayProxyEvent = {
      ...mockEvent,
      path: '/catalog/products',
      headers: {},
      pathParameters: null
    };

    vi.mocked(mockExecuteRequestUseCase.execute).mockResolvedValue(mockResponse);

    await proxyLambdaHandler.handleRequest(eventWithoutExplicitId, mockContext);

    expect(mockExecuteRequestUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'catalog' })
    );
  });
});
