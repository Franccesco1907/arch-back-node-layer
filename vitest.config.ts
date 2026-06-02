import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        '**/*.interface.ts',
        '**/*.type.ts',
        '**/types/**',
        'src/server.ts' // Archivo de entrada del servidor
      ],
      include: [
        'src/**/*.ts'
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      // Configuración para reportes SonarQube
      watermarks: {
        statements: [80, 95],
        functions: [80, 95],
        branches: [80, 95],
        lines: [80, 95]
      }
    },
    setupFiles: ['./tests/setup.ts'],
    // Configuración para reportes de testing
    outputFile: {
      junit: './coverage/junit.xml',
      json: './coverage/test-results.json'
    },
    // Configuración para pruebas paralelas
    pool: 'threads',
    maxWorkers: 4,
    minWorkers: 1,
    // Timeout para pruebas
    testTimeout: 10000,
    hookTimeout: 10000,
    // Configuración para watch mode
    watch: false,
    // Keep tests deterministic: several adapter tests mock module-level clients
    // such as axios and AWS SDK clients, so concurrent execution can make mocks
    // bleed across files.
    sequence: {
      concurrent: false,
      shuffle: false
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tests': resolve(__dirname, './tests'),
      '@mocks': resolve(__dirname, './tests/mocks'),
      '@fixtures': resolve(__dirname, './tests/fixtures')
    }
  }
});
