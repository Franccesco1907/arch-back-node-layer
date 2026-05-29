export interface ProxyRequest {
  id: string;
  operation: string;
  method: HttpMethodType;
  path: string;
  headers?: Record<string, string | undefined>;
  queryParameters?: Record<string, string | undefined>;
  body?: any;
  pathParameters?: Record<string, string | undefined>;
}

export interface ProxyResponse {
  statusCode: number;
  headers?: Record<string, any>;
  body: any;
  fullEndpoint: string;
}

export enum HttpMethodType {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

export enum AuthType {
  NONE = 'NONE',
  BEARER = 'BEARER',
  BASIC = 'BASIC',
  API_KEY = 'API_KEY'
}

export interface RequestParam {
  name: string;
  value: string;
  type: 'HEADER' | 'QUERY' | 'PATH';
}

export interface ConfigRequest {
  id: string;
  operation: string;
  endpoint: string;
  method: HttpMethodType;
  authType: AuthType;
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, string>;
}