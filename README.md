# Arch Back Node Layer

TypeScript backend with a Fastify user endpoint and an AWS Lambda proxy. Application ports isolate DynamoDB, SQS, Secrets Manager and HTTP adapters.

## Local use

Node.js 24+ (see `.nvmrc`).

```sh
npm ci
npm run build
npm start
```

Fastify listens on `http://localhost:3100` by default (override `PORT`). `GET /health` checks health; `POST /users` accepts `name` and `email`. `npm run dev` runs the TypeScript entry directly.

Without `USERS_TABLE`, users are kept in memory and disappear on restart. Set it plus AWS credentials and `AWS_REGION` to use DynamoDB. `DYNAMO_TABLE` configures the Lambda proxy, not the user repository. See `serverless.yml` for cloud resources; local use needs no deployment.

## Verification and boundaries

Run `npm run test:run` and `npm run build`. Tests live under `tests/application`, `tests/adapter`, `tests/http`, `tests/architecture`, `tests/contract` and `tests/performance`.

The existing CI is not a passing baseline: it selects Node 18 despite the Node 24 engine, references absent `tests/unit` and `tests/integration`, and invokes lint/format tools missing from dev dependencies.

- `src/application`: domain, ports and services; keep external SDKs in adapters.
- `src/adapter`: Lambda input and external service/persistence output adapters.
- `src/infrastructure/config/DependencyInjection.ts`: composition.
- `src/server.ts` / `src/index.ts`: HTTP / Lambda entry points.

`package.json` declares ISC; this checkout does not contain the LICENSE file previously linked by this README.
