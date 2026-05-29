export interface SecretManagerPort {
  getSecret(secretArn: string): Promise<string>;
  getSecretValue(secretArn: string, key: string): Promise<string>;
}