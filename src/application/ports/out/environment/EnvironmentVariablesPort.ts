export interface EnvironmentVariablesPort {
  getVariable(key: string): string | undefined;
  getRequiredVariable(key: string): string;
  getAllVariables(): Record<string, string>;
}

export class EnvironmentConstants {
  static readonly DYNAMO_TABLE = 'DYNAMO_TABLE';
  static readonly USERS_TABLE = 'USERS_TABLE';
  static readonly AWS_REGION = 'AWS_REGION';
  static readonly SQS_QUEUE_URL = 'SQS_QUEUE_URL';
  static readonly SECRET_MANAGER_ARN = 'SECRET_MANAGER_ARN';
  static readonly API_TIMEOUT = 'API_TIMEOUT';
}
