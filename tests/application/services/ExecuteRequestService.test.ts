import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecuteRequestService } from '../../../src/application/services/ExecuteRequestService';
import { QueryConfigurationPort } from '../../../src/application/ports/out/persistence/QueryConfigurationPort';
import { HttpExecutorPort } from '../../../src/application/ports/out/web/HttpExecutorPort';
import { BrokerMessageSenderPort } from '../../../src/application/ports/out/broker/BrokerMessageSenderPort';
import { EnvironmentVariablesPort } from '../../../src/application/ports/out/environment/EnvironmentVariablesPort';
import { ProxyRequest, ProxyResponse, ConfigRequest, HttpMethodType, AuthType } from '../../../src/application/domain/ProxyRequest';
import { BrokerMessage } from '../../../src/application/domain/BrokerMessage';

describe('ExecuteRequestService', () => {
  let executeRequestService: ExecuteRequestService;
  let mockQueryConfigurationPort: QueryConfigurationPort;
  let mockHttpExecutorPort: HttpExecutorPort;
  let mockBrokerMessageSenderPort: BrokerMessageSenderPort;
  let mockEnvironmentVariablesPort: EnvironmentVariablesPort;

  const mockProxyRequest: ProxyRequest = {
    id: 'test-id',
    operation: 'GET',
    path: '/test',
    queryStringParameters: {},
    headers: {},
    body: '',
    pathParameters: {},
    requestContext: {} as any
  };

  const mockConfigRequest: ConfigRequest = {
    id: 'test-id',
    operation: 'GET',
    endpoint: 'https://api.example.com/test',
    method: HttpMethodType.GET,
    timeout: 30000,
    authType: AuthType.NONE,
    headers: {},
    params: {}
  };

  const mockProxyResponse: ProxyResponse = {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { message: 'success' },
    fullEndpoint: 'https://api.example.com/test'
  };

  beforeEach(() => {
    mockQueryConfigurationPort = {
      query: vi.fn(),
      save: vi.fn(),
      delete: vi.fn()
    };

    mockHttpExecutorPort = {
      executeRequest: vi.fn()
    };

    mockBrokerMessageSenderPort = {
      sendMessage: vi.fn()
    };

    mockEnvironmentVariablesPort = {
      getVariable: vi.fn(),
      getRequiredVariable: vi.fn(),
      getAllVariables: vi.fn()
    };

    executeRequestService = new ExecuteRequestService(
      mockQueryConfigurationPort,
      mockHttpExecutorPort,
      mockBrokerMessageSenderPort,
      mockEnvironmentVariablesPort
    );
  });

  it('should execute request successfully', async () => {
    // Given
    vi.mocked(mockQueryConfigurationPort.query).mockResolvedValue(mockConfigRequest);
    vi.mocked(mockHttpExecutorPort.executeRequest).mockResolvedValue(mockProxyResponse);
    vi.mocked(mockBrokerMessageSenderPort.sendMessage).mockResolvedValue();

    // When
    const result = await executeRequestService.execute(mockProxyRequest);

    // Then
    expect(result).toEqual(mockProxyResponse);
    expect(mockQueryConfigurationPort.query).toHaveBeenCalledWith('test-id', 'GET');
    expect(mockHttpExecutorPort.executeRequest).toHaveBeenCalledWith(mockProxyRequest, mockConfigRequest);
    expect(mockBrokerMessageSenderPort.sendMessage).toHaveBeenCalledWith({
      endpoint: 'https://api.example.com/test',
      statusCode: 200,
      timestamp: expect.any(Date),
      success: true
    });
  });

  it('should handle configuration query error', async () => {
    // Given
    const error = new Error('Configuration not found');
    vi.mocked(mockQueryConfigurationPort.query).mockRejectedValue(error);

    // When & Then
    await expect(executeRequestService.execute(mockProxyRequest)).rejects.toThrow('Configuration not found');
    expect(mockHttpExecutorPort.executeRequest).not.toHaveBeenCalled();
    expect(mockBrokerMessageSenderPort.sendMessage).not.toHaveBeenCalled();
  });

  it('should handle HTTP execution error', async () => {
    // Given
    vi.mocked(mockQueryConfigurationPort.query).mockResolvedValue(mockConfigRequest);
    const error = new Error('HTTP request failed');
    vi.mocked(mockHttpExecutorPort.executeRequest).mockRejectedValue(error);

    // When & Then
    await expect(executeRequestService.execute(mockProxyRequest)).rejects.toThrow('HTTP request failed');
    expect(mockBrokerMessageSenderPort.sendMessage).not.toHaveBeenCalled();
  });

  it('should continue execution even if broker message fails', async () => {
    // Given
    vi.mocked(mockQueryConfigurationPort.query).mockResolvedValue(mockConfigRequest);
    vi.mocked(mockHttpExecutorPort.executeRequest).mockResolvedValue(mockProxyResponse);
    vi.mocked(mockBrokerMessageSenderPort.sendMessage).mockRejectedValue(new Error('Broker error'));

    // When
    const result = await executeRequestService.execute(mockProxyRequest);

    // Then
    expect(result).toEqual(mockProxyResponse);
    expect(mockBrokerMessageSenderPort.sendMessage).toHaveBeenCalled();
  });

  it('should send broker message with success=false for error status codes', async () => {
    // Given
    const errorResponse: ProxyResponse = {
      statusCode: 500,
      headers: {},
      body: { error: 'Internal server error' },
      fullEndpoint: 'https://api.example.com/test'
    };

    vi.mocked(mockQueryConfigurationPort.query).mockResolvedValue(mockConfigRequest);
    vi.mocked(mockHttpExecutorPort.executeRequest).mockResolvedValue(errorResponse);
    vi.mocked(mockBrokerMessageSenderPort.sendMessage).mockResolvedValue();

    // When
    const result = await executeRequestService.execute(mockProxyRequest);

    // Then
    expect(result).toEqual(errorResponse);
    expect(mockBrokerMessageSenderPort.sendMessage).toHaveBeenCalledWith({
      endpoint: 'https://api.example.com/test',
      statusCode: 500,
      timestamp: expect.any(Date),
      success: false
    });
  });
});