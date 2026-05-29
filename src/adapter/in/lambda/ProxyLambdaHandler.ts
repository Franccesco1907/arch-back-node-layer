import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ExecuteRequestUseCase } from '../../../application/ports/in/execute/ExecuteRequestUseCase';
import { ProxyRequest } from '../../../application/domain/ProxyRequest';
import { ProxyLambdaException } from '../../../application/exceptions/ProxyLambdaException';
import { HttpMethodType } from '../../../application/domain/ProxyRequest';

export class ProxyLambdaHandler {
  constructor(private readonly executeRequestUseCase: ExecuteRequestUseCase) {}

  async handleRequest(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      console.log('Lambda event:', JSON.stringify(event, null, 2));
      console.log('Lambda context:', JSON.stringify(context, null, 2));

      const proxyRequest = this.mapToProxyRequest(event);
      const response = await this.executeRequestUseCase.execute(proxyRequest);

      return {
        statusCode: response.statusCode,
        headers: response.headers || {},
        body: JSON.stringify(response.body)
      };
    } catch (error) {
      console.error('Error processing request:', error);
      
      if (error instanceof ProxyLambdaException) {
        return {
          statusCode: error.statusCode,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: error.message })
        };
      }

      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  private mapToProxyRequest(event: APIGatewayProxyEvent): ProxyRequest {
    const headers = event.headers || {};
    const pathParameters = event.pathParameters || {};

    return {
      id: this.resolveConfigurationId(event, headers, pathParameters),
      operation: event.httpMethod,
      method: event.httpMethod as HttpMethodType,
      path: event.path,
      queryParameters: event.queryStringParameters || {},
      headers,
      body: event.body || '',
      pathParameters
    };
  }

  private resolveConfigurationId(
    event: APIGatewayProxyEvent,
    headers: Record<string, string | undefined>,
    pathParameters: Record<string, string | undefined>
  ): string {
    const explicitPathId = pathParameters.id;
    if (explicitPathId) {
      return explicitPathId;
    }

    const headerConfigId = this.findHeader(headers, 'x-proxy-config-id');
    if (headerConfigId) {
      return headerConfigId;
    }

    const firstPathSegment = event.path.split('/').filter(Boolean)[0];
    if (firstPathSegment) {
      return firstPathSegment;
    }

    return event.requestContext.resourcePath || event.resource || event.path;
  }

  private findHeader(headers: Record<string, string | undefined>, name: string): string | undefined {
    const headerKey = Object.keys(headers).find(key => key.toLowerCase() === name);
    return headerKey ? headers[headerKey] : undefined;
  }
}
