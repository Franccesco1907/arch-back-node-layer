import Fastify from "fastify";
import { DependencyInjection } from "./infrastructure/config/DependencyInjection";

interface CreateUserBody {
  name: string;
  email: string;
}

function isCreateUserBody(body: unknown): body is CreateUserBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "name" in body &&
    "email" in body &&
    typeof body.name === "string" &&
    typeof body.email === "string"
  );
}

export function buildServer() {
  const app = Fastify({ logger: true });
  const createUserUseCase = DependencyInjection.getInstance().getCreateUserUseCase();

  // Root route to respond 200 and provide basic info
  app.get("/", async (_req, reply) => {
    return reply.code(200).send({ name: "arch-back-node-layer", status: "running" });
  });

  // Favicon route to avoid 404 logs from browsers
  app.get("/favicon.ico", async (_req, reply) => {
    reply.header("Cache-Control", "public, max-age=86400");
    return reply.code(204).send();
  });

  app.get("/health", async (_req, reply) => {
    return reply.code(200).send({ status: "ok" });
  });

  app.post("/users", async (req, reply) => {
    try {
      if (!isCreateUserBody(req.body) || !req.body.name) {
        return reply.code(400).send({ error: "Invalid name" });
      }
      if (!req.body.email || !req.body.email.includes("@")) {
        return reply.code(400).send({ error: "Invalid email" });
      }
      const user = await createUserUseCase.createUser({ name: req.body.name, email: req.body.email });
      return reply.code(201).send({ id: user.id });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      return reply.code(500).send({ error: message });
    }
  });

  return app;
}

async function main() {
  const app = buildServer();
  const port = Number(process.env.PORT ?? 3100);
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Layer server running at http://localhost:${port}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
