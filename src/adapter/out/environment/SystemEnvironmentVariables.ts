import { EnvironmentVariablesPort } from '../../../application/ports/out/environment/EnvironmentVariablesPort';

export class SystemEnvironmentVariables implements EnvironmentVariablesPort {
  getVariable(key: string): string | undefined {
    return process.env[key];
  }

  getRequiredVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  getAllVariables(): Record<string, string> {
    return { ...process.env } as Record<string, string>;
  }
}