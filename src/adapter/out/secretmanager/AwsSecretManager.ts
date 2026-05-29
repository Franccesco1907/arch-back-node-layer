import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SecretManagerPort } from '../../../application/ports/out/secretmanager/SecretManagerPort';
import { EnvironmentVariablesPort, EnvironmentConstants } from '../../../application/ports/out/environment/EnvironmentVariablesPort';

export class AwsSecretManager implements SecretManagerPort {
  private readonly secretsClient: SecretsManagerClient;

  constructor(private readonly environmentVariablesPort: EnvironmentVariablesPort) {
    const region = this.environmentVariablesPort.getRequiredVariable(EnvironmentConstants.AWS_REGION);
    this.secretsClient = new SecretsManagerClient({ region });
  }

  async getSecret(secretArn: string): Promise<string> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretArn
      });

      const result = await this.secretsClient.send(command);
      
      if (!result.SecretString) {
        throw new Error(`Secret value not found for ARN: ${secretArn}`);
      }

      return result.SecretString;
    } catch (error) {
      console.error('Error retrieving secret from AWS Secrets Manager:', error);
      throw error;
    }
  }

  async getSecretValue(secretArn: string, key: string): Promise<string> {
    try {
      const secretString = await this.getSecret(secretArn);
      const secretObject = JSON.parse(secretString);
      
      if (!(key in secretObject)) {
        throw new Error(`Key '${key}' not found in secret ${secretArn}`);
      }

      return secretObject[key];
    } catch (error) {
      console.error(`Error retrieving secret value for key '${key}':`, error);
      throw error;
    }
  }
}