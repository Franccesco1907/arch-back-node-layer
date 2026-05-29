import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { AxiosResponse } from 'axios';
import { HttpClientExecutor } from '../../../../src/adapter/out/web/HttpClientExecutor';
import { SecretManagerPort } from '../../../../src/application/ports/out/secretmanager/SecretManagerPort';
import { EnvironmentVariablesPort, EnvironmentConstants } from '../../../../src/application/ports/out/environment/EnvironmentVariablesPort';
import { ProxyRequest, ConfigRequest, HttpMethodType, AuthType } from '../../../../src/application/domain/ProxyRequest';

// Mock axios
vi.mock('axios');

describe('HttpClientExecutor', () => {
  let httpClientExecutor: HttpClientExecutor;
  let mockSecretManagerPort: SecretManagerPort;
  let mockEnvironmentVariablesPort: EnvironmentVariablesPort;

  const mockProxyRequest: ProxyRequest = {
    id: 'test-id',
    operation: 'GET',
    method: HttpMethodType.GET,
    path: '/test/{id}',
    queryParameters: { param1: 'value1' },
    headers: { 'X-Custom-Header': 'custom-value' },
    body: '{"test": "data"}',
    pathParameters: { id: '123' }
  };

  const mockConfigRequest: ConfigRequest = {
    id: 'test-id',
    operation: 'GET',
    endpoint: 'https://api.example.com/test/{id}',
    method: HttpMethodType.GET,
    timeout: 30000,
    authType: AuthType.NONE,
    headers: { 'Content-Type': 'application/json' },
    params: { version: 'v1' }
  };

  beforeEach(() => {
    mockSecretManagerPort = {
      getSecret: vi.fn(),
      getSecretValue: vi.fn()
    };

    mockEnvironmentVariablesPort = {
      getVariable: vi.fn(),
      getRequiredVariable: vi.fn(),
      getAllVariables: vi.fn()
    };

    vi.mocked(mockEnvironmentVariablesPort.getVariable)
      .mockImplementation((key: string) => {
        if (key === EnvironmentConstants.API_TIMEOUT) return '30000';
        if (key === EnvironmentConstants.SECRET_MANAGER_ARN) return 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret';
        return undefined;
      });

    httpClientExecutor = new HttpClientExecutor(
      mockSecretManagerPort,
      mockEnvironmentVariablesPort
    );
  });

  it('should execute GET request successfully', async () => {
    // Given
    const mockAxiosResponse: AxiosResponse = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      data: { message: 'success' },
      statusText: 'OK',
      config: {} as any,
      request: {}
    };

    vi.mocked(axios).mockResolvedValue(mockAxiosResponse);

    // When
    const result = await httpClientExecutor.executeRequest(mockProxyRequest, mockConfigRequest);

    // Then
    expect(result).toEqual({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'success' },
      fullEndpoint: 'https://api.example.com/test/123'
    });

    expect(axios).toHaveBeenCalledWith({
      method: 'get',
      url: 'https://api.example.com/test/123',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value'
      },
      params: { param1: 'value1', version: 'v1' },
      timeout: 30000,
      validateStatus: expect.any(Function)
    });
  });

  it('should execute POST request with body', async () => {
    // Given
    const postConfigRequest: ConfigRequest = {
      ...mockConfigRequest,
      method: HttpMethodType.POST
    };

    const mockAxiosResponse: AxiosResponse = {
      status: 201,
      headers: {},
      data: { id: 'created' },
      statusText: 'Created',
      config: {} as any,
      request: {}
    };

    vi.mocked(axios).mockResolvedValue(mockAxiosResponse);

    // When
    const result = await httpClientExecutor.executeRequest(mockProxyRequest, postConfigRequest);

    // Then
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        data: { test: 'data' }
      })
    );
  });

  it('should handle Bearer token authentication', async () => {
    // Given
    const authConfigRequest: ConfigRequest = {
      ...mockConfigRequest,
      authType: AuthType.BEARER
    };

    vi.mocked(mockSecretManagerPort.getSecretValue).mockResolvedValue('bearer-token-123');

    const mockAxiosResponse: AxiosResponse = {
      status: 200,
      headers: {},
      data: {},
      statusText: 'OK',
      config: {} as any,
      request: {}
    };

    vi.mocked(axios).mockResolvedValue(mockAxiosResponse);

    // When
    await httpClientExecutor.executeRequest(mockProxyRequest, authConfigRequest);

    // Then
    expect(mockSecretManagerPort.getSecretValue).toHaveBeenCalledWith(
      'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret',
      'bearer_token'
    );

    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer bearer-token-123'
        })
      })
    );
  });

  it('should handle API key authentication', async () => {
    // Given
    const authConfigRequest: ConfigRequest = {
      ...mockConfigRequest,
      authType: AuthType.API_KEY
    };

    vi.mocked(mockSecretManagerPort.getSecretValue).mockResolvedValue('api-key-123');

    const mockAxiosResponse: AxiosResponse = {
      status: 200,
      headers: {},
      data: {},
      statusText: 'OK',
      config: {} as any,
      request: {}
    };

    vi.mocked(axios).mockResolvedValue(mockAxiosResponse);

    // When
    await httpClientExecutor.executeRequest(mockProxyRequest, authConfigRequest);

    // Then
    expect(mockSecretManagerPort.getSecretValue).toHaveBeenCalledWith(
      'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret',
      'api_key'
    );

    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-API-Key': 'api-key-123'
        })
      })
    );
  });

  it('should handle axios error', async () => {
    // Given
    const mockProxyRequestWithoutPathParams: ProxyRequest = {
      id: 'test-id',
      operation: 'GET',
      method: HttpMethodType.GET,
      path: '/test/{id}',
      queryParameters: { param1: 'value1' },
      headers: { 'X-Custom-Header': 'custom-value' },
      body: '{"test": "data"}',
      pathParameters: {}
    };

    const axiosError = {
      isAxiosError: true,
      response: {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        data: { error: 'Not found' }
      }
    };

    vi.mocked(axios).mockRejectedValue(axiosError);
    vi.mocked(axios.isAxiosError).mockReturnValue(true);

    // When
    const result = await httpClientExecutor.executeRequest(mockProxyRequestWithoutPathParams, mockConfigRequest);

    // Then
    expect(result).toEqual({
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Not found' },
      fullEndpoint: 'https://api.example.com/test/{id}'
    });
  });

  it('should handle generic error', async () => {
    // Given
    const genericError = new Error('Network error');
    vi.mocked(axios).mockRejectedValue(genericError);
    vi.mocked(axios.isAxiosError).mockReturnValue(false);

    // When
    const result = await httpClientExecutor.executeRequest(mockProxyRequest, mockConfigRequest);

    // Then
    expect(result).toEqual({
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Internal server error' },
      fullEndpoint: 'https://api.example.com/test/{id}'
    });
  });

  it('should replace path and config parameters in endpoint', async () => {
    // Given
    const configWithParams: ConfigRequest = {
      ...mockConfigRequest,
      endpoint: 'https://api.example.com/{version}/test/{id}',
      params: { version: 'v2' }
    };

    const mockAxiosResponse: AxiosResponse = {
      status: 200,
      headers: {},
      data: {},
      statusText: 'OK',
      config: {} as any,
      request: {}
    };

    vi.mocked(axios).mockResolvedValue(mockAxiosResponse);

    // When
    const result = await httpClientExecutor.executeRequest(mockProxyRequest, configWithParams);

    // Then
    expect(result.fullEndpoint).toBe('https://api.example.com/v2/test/123');
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api.example.com/v2/test/123'
      })
    );
  });
});