import { beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/server';

describe('User API Contract Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  it('GET /health returns the public health contract', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('POST /users creates a user and returns only the generated id', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'Jane Smith', email: 'jane.smith@example.com' },
    });

    const body = response.json<{ id: string }>();

    expect(response.statusCode).toBe(201);
    expect(response.headers['content-type']).toContain('application/json');
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(0);
  });

  it('POST /users rejects invalid names with the public error contract', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: '', email: 'jane.smith@example.com' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'Invalid name' });
  });

  it('POST /users rejects invalid email values with the public error contract', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'Jane Smith', email: 'invalid-email' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'Invalid email' });
  });
});
