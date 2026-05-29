import { vi } from 'vitest';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Axios Mock
export const createAxiosMock = () => {
  const axiosMock = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    request: vi.fn(),
    create: vi.fn(() => axiosMock),
    defaults: {
      headers: {
        common: {},
        get: {},
        post: {},
        put: {},
        delete: {},
        patch: {},
      },
      timeout: 0,
      baseURL: '',
    },
    interceptors: {
      request: {
        use: vi.fn(),
        eject: vi.fn(),
      },
      response: {
        use: vi.fn(),
        eject: vi.fn(),
      },
    },
  };

  return axiosMock;
};

// HTTP Response Mock Factory
export const createHttpResponse = (data: any, status = 200, headers = {}) => ({
  data,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: {
    'content-type': 'application/json',
    ...headers,
  },
  config: {
    url: 'http://test.com',
    method: 'get',
    headers: {},
  },
});

// HTTP Error Mock Factory
export const createHttpError = (status: number, message: string, data?: any) => {
  const error = new Error(message);
  (error as any).response = {
    status,
    statusText: message,
    data: data || { error: message },
    headers: {},
  };
  (error as any).request = {};
  (error as any).config = {};
  return error;
};

// Fastify Mock
export const createFastifyMock = (): Partial<FastifyInstance> => {
  const routes: any[] = [];
  
  const fastifyMock = {
    get: vi.fn((url, handler) => {
      routes.push({ method: 'GET', url, handler });
      return fastifyMock;
    }),
    post: vi.fn((url, handler) => {
      routes.push({ method: 'POST', url, handler });
      return fastifyMock;
    }),
    put: vi.fn((url, handler) => {
      routes.push({ method: 'PUT', url, handler });
      return fastifyMock;
    }),
    delete: vi.fn((url, handler) => {
      routes.push({ method: 'DELETE', url, handler });
      return fastifyMock;
    }),
    patch: vi.fn((url, handler) => {
      routes.push({ method: 'PATCH', url, handler });
      return fastifyMock;
    }),
    listen: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    ready: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    addHook: vi.fn(),
    addSchema: vi.fn(),
    setErrorHandler: vi.fn(),
    setNotFoundHandler: vi.fn(),
    log: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
    },
    // Helper para obtener rutas registradas
    getRoutes: () => routes,
    // Helper para simular requests
    inject: vi.fn(),
  };

  return fastifyMock;
};

// Fastify Request Mock
export const createFastifyRequest = (overrides: Partial<FastifyRequest> = {}): Partial<FastifyRequest> => ({
  id: 'test-request-id',
  params: {},
  query: {},
  body: {},
  headers: {
    'content-type': 'application/json',
    'user-agent': 'test-agent',
  },
  raw: {} as any,
  server: {} as any,
  url: '/test',
  method: 'GET',
  routerPath: '/test',
  routerMethod: 'GET',
  is404: false,
  ip: '127.0.0.1',
  ips: ['127.0.0.1'],
  hostname: 'localhost',
  protocol: 'http',
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
  } as any,
  ...overrides,
});

// Fastify Reply Mock
export const createFastifyReply = (): Partial<FastifyReply> => {
  const replyMock = {
    code: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
    headers: vi.fn().mockReturnThis(),
    type: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
    callNotFound: vi.fn().mockReturnThis(),
    getHeader: vi.fn(),
    getHeaders: vi.fn(() => ({})),
    hasHeader: vi.fn(() => false),
    removeHeader: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    serializer: vi.fn(),
    raw: {
      writeHead: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    } as any,
    sent: false,
    log: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
    } as any,
  };

  return replyMock;
};

// HTTP Client Mock Factory
export const createHttpClientMockFactory = () => {
  const axiosMock = createAxiosMock();
  
  return {
    axios: axiosMock,
    resetMocks: () => {
      Object.values(axiosMock).forEach(mock => {
        if (typeof mock === 'function' && 'mockReset' in mock) {
          mock.mockReset();
        }
      });
    },
    setupSuccessResponse: (data: any, status = 200) => {
      const response = createHttpResponse(data, status);
      axiosMock.get.mockResolvedValue(response);
      axiosMock.post.mockResolvedValue(response);
      axiosMock.put.mockResolvedValue(response);
      axiosMock.delete.mockResolvedValue(response);
      axiosMock.patch.mockResolvedValue(response);
      return response;
    },
    setupErrorResponse: (status: number, message: string, data?: any) => {
      const error = createHttpError(status, message, data);
      axiosMock.get.mockRejectedValue(error);
      axiosMock.post.mockRejectedValue(error);
      axiosMock.put.mockRejectedValue(error);
      axiosMock.delete.mockRejectedValue(error);
      axiosMock.patch.mockRejectedValue(error);
      return error;
    },
  };
};

// Request/Response Test Helpers
export const createTestRequestResponse = () => {
  const request = createFastifyRequest();
  const reply = createFastifyReply();
  
  return { request, reply };
};

// Common HTTP Status Responses
export const HTTP_RESPONSES = {
  OK: (data: any) => createHttpResponse(data, 200),
  CREATED: (data: any) => createHttpResponse(data, 201),
  NO_CONTENT: () => createHttpResponse(null, 204),
  BAD_REQUEST: (message: string) => createHttpError(400, message),
  UNAUTHORIZED: (message: string) => createHttpError(401, message),
  FORBIDDEN: (message: string) => createHttpError(403, message),
  NOT_FOUND: (message: string) => createHttpError(404, message),
  INTERNAL_SERVER_ERROR: (message: string) => createHttpError(500, message),
};