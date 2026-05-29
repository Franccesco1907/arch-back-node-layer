import { describe, it, expect } from "vitest";
import { UserService } from "../../../src/application/services/UserService";
import { InMemoryUserRepository } from "../../../src/adapter/out/persistence/user/InMemoryUserRepository";

describe("UserService", () => {
  it("createUser retorna usuario con id y campos correctos", async () => {
    const repo = new InMemoryUserRepository();
    const svc = new UserService(repo);
    const input = { name: "John Doe", email: "john@example.com" };
    const user = await svc.createUser(input);

    expect(typeof user.id).toBe("string");
    expect(user.id.length).toBeGreaterThan(0);
    expect(user.name).toBe(input.name);
    expect(user.email).toBe(input.email);
  });
});
