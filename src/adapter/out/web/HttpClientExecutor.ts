import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpExecutorPort } from '../../../application/ports/out/web/HttpExecutorPort';
import { ProxyRequest, ProxyResponse, ConfigRequest, HttpMethodType, AuthType } from '../../../application/domain/ProxyRequest';
import { SecretManagerPort } from '../../../application/ports/out/secretmanager/SecretManagerPort';
import { EnvironmentVariablesPort, EnvironmentConstants } from '../../../application/ports/out/environment/EnvironmentVariablesPort';

export class HttpClientExecutor implements HttpExecutorPort {
  constructor(
    private readonly secretManagerPort: SecretManagerPort,
    private readonly environmentVariablesPort: EnvironmentVariablesPort
  ) {}

  async executeRequest(request: ProxyRequest, config: ConfigRequest): Promise<ProxyResponse> {
    try {
      const fullEndpoint = this.buildFullEndpoint(config.endpoint, request.pathParameters || {}, config.params || {});
      const headers = await this.buildHeaders(config, request);
      const timeout = config.timeout || parseInt(this.environmentVariablesPort.getVariable(EnvironmentConstants.API_TIMEOUT) || '30000');

      const axiosConfig: AxiosRequestConfig = {
        method: config.method.toLowerCase() as any,
        url: fullEndpoint,
        headers,
        timeout,
        validateStatus: () => true // Don't throw on HTTP error status codes
      };

      // Add body for POST, PUT, PATCH methods
      if (['POST', 'PUT', 'PATCH'].includes(config.method.toUpperCase()) && request.body) {
        axiosConfig.data = this.parseRequestBody(request.body, headers['Content-Type']);
      }

      // Add query parameters
      const allParams: Record<string, string> = {};
      
      // Add config params first
      if (config.params && Object.keys(config.params).length > 0) {
        Object.entries(config.params).forEach(([key, value]) => {
          allParams[key] = value;
        });
      }
      
      // Add request query parameters (these can override config params)
      if (request.queryParameters && Object.keys(request.queryParameters).length > 0) {
        Object.entries(request.queryParameters).forEach(([key, value]) => {
          if (value !== undefined) {
            allParams[key] = value;
          }
        });
      }
      
      if (Object.keys(allParams).length > 0) {
        axiosConfig.params = allParams;
      }

      console.log(`Executing ${config.method} request to: ${fullEndpoint}`);
      
      const response: AxiosResponse = await axios(axiosConfig);

      return {
        statusCode: response.status,
        headers: response.headers,
        body: response.data,
        fullEndpoint
      };
    } catch (error) {
      console.error('Error executing HTTP request:', error);
      
      if (axios.isAxiosError(error)) {
        return {
          statusCode: error.response?.status || 500,
          headers: error.response?.headers || {},
          body: error.response?.data || { error: error.message },
          fullEndpoint: config.endpoint
        };
      }

      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Internal server error' },
        fullEndpoint: config.endpoint
      };
    }
  }

  private buildFullEndpoint(endpoint: string, pathParameters: Record<string, string | undefined>, configParams: Record<string, string>): string {
    let fullEndpoint = endpoint;

    // Replace path parameters
    Object.entries(pathParameters).forEach(([key, value]) => {
      if (value !== undefined) {
        fullEndpoint = fullEndpoint.replace(`{${key}}`, value);
      }
    });

    // Replace config parameters
    Object.entries(configParams).forEach(([key, value]) => {
      fullEndpoint = fullEndpoint.replace(`{${key}}`, value);
    });

    return fullEndpoint;
  }

  private async buildHeaders(config: ConfigRequest, request: ProxyRequest): Promise<Record<string, any>> {
    const headers: Record<string, any> = {
      'Content-Type': 'application/json',
      ...config.headers,
      ...request.headers
    };

    // Handle authentication
    if (config.authType === AuthType.BEARER) {
      const secretArn = this.environmentVariablesPort.getVariable(EnvironmentConstants.SECRET_MANAGER_ARN);
      if (secretArn) {
        try {
          const token = await this.secretManagerPort.getSecretValue(secretArn, 'bearer_token');
          headers['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          console.warn('Could not retrieve bearer token from secret manager:', error);
        }
      }
    } else if (config.authType === AuthType.API_KEY) {
      const secretArn = this.environmentVariablesPort.getVariable(EnvironmentConstants.SECRET_MANAGER_ARN);
      if (secretArn) {
        try {
          const apiKey = await this.secretManagerPort.getSecretValue(secretArn, 'api_key');
          headers['X-API-Key'] = apiKey;
        } catch (error) {
          console.warn('Could not retrieve API key from secret manager:', error);
        }
      }
    }

    return headers;
  }

  private parseRequestBody(body: string, contentType?: string): any {
    if (!body) return undefined;

    try {
      if (contentType?.includes('application/json')) {
        return JSON.parse(body);
      }
      return body;
    } catch (error) {
      console.warn('Could not parse request body as JSON, using as string:', error);
      return body;
    }
  }
}