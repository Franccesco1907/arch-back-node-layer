import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

describe('Hexagonal Architecture Tests', () => {
  const srcPath = join(process.cwd(), 'src');

  describe('Layer Structure', () => {
    it('should keep domain models inside the application layer for this archetype', () => {
      expect(existsSync(join(srcPath, 'application', 'domain'))).toBe(true);
      expect(existsSync(join(srcPath, 'application', 'domain', 'User.ts'))).toBe(true);
    });

    it('should expose user input and output ports', () => {
      expect(existsSync(join(srcPath, 'application', 'ports', 'in', 'user', 'CreateUserUseCase.ts'))).toBe(true);
      expect(existsSync(join(srcPath, 'application', 'ports', 'out', 'persistence', 'UserRepositoryPort.ts'))).toBe(true);
    });

    it('should place user persistence adapters under adapter/out', () => {
      const userPersistencePath = join(srcPath, 'adapter', 'out', 'persistence', 'user');

      expect(existsSync(join(userPersistencePath, 'InMemoryUserRepository.ts'))).toBe(true);
      expect(existsSync(join(userPersistencePath, 'DynamoUserRepository.ts'))).toBe(true);
    });

    it('should not keep TypeScript files in old root services or repositories folders', () => {
      expect(getAllTypeScriptFiles(join(srcPath, 'services'))).toHaveLength(0);
      expect(getAllTypeScriptFiles(join(srcPath, 'repositories'))).toHaveLength(0);
    });
  });

  describe('Dependency Rules', () => {
    it('should not let application import adapter, infrastructure, or old repositories/services roots', () => {
      const applicationFiles = getAllTypeScriptFiles(join(srcPath, 'application'));

      applicationFiles.forEach(file => {
        const content = readFileSync(file, 'utf8');
        expect(content, relative(srcPath, file)).not.toMatch(/from\s+['"].*\/adapter\//);
        expect(content, relative(srcPath, file)).not.toMatch(/from\s+['"].*\/infrastructure\//);
        expect(content, relative(srcPath, file)).not.toMatch(/from\s+['"].*\/repositories(\/|['"])/);
        expect(content, relative(srcPath, file)).not.toMatch(/from\s+['"].*\/services(\/|['"])/);
      });
    });

    it('should keep application domain models independent from adapters and infrastructure', () => {
      const domainFiles = getAllTypeScriptFiles(join(srcPath, 'application', 'domain'));

      domainFiles.forEach(file => {
        const content = readFileSync(file, 'utf8');
        expect(content, relative(srcPath, file)).not.toMatch(/from\s+['"].*\/adapter\//);
        expect(content, relative(srcPath, file)).not.toMatch(/from\s+['"].*\/infrastructure\//);
      });
    });

    it('should not let adapters import infrastructure', () => {
      const adapterFiles = getAllTypeScriptFiles(join(srcPath, 'adapter'));

      adapterFiles.forEach(file => {
        const content = readFileSync(file, 'utf8');
        expect(content, relative(srcPath, file)).not.toMatch(/from\s+['"].*\/infrastructure\//);
      });
    });
  });

  describe('Port and Adapter Pattern', () => {
    it('should define ports as interfaces', () => {
      const portFiles = getAllTypeScriptFiles(join(srcPath, 'application', 'ports'));

      portFiles.forEach(file => {
        const content = readFileSync(file, 'utf8');
        expect(content, relative(srcPath, file)).toMatch(/export\s+interface\s+/);
      });
    });

    it('should have user persistence adapters implement the user repository port', () => {
      const userAdapterFiles = getAllTypeScriptFiles(join(srcPath, 'adapter', 'out', 'persistence', 'user'));

      userAdapterFiles.forEach(file => {
        const content = readFileSync(file, 'utf8');
        expect(content, relative(srcPath, file)).toMatch(/implements\s+UserRepositoryPort/);
      });
    });
  });
});

function getAllTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) {
    return files;
  }

  const items = readdirSync(dir);

  items.forEach(item => {
    const itemPath = join(dir, item);
    const stats = statSync(itemPath);

    if (stats.isDirectory()) {
      files.push(...getAllTypeScriptFiles(itemPath));
      return;
    }

    if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      files.push(itemPath);
    }
  });

  return files;
}
