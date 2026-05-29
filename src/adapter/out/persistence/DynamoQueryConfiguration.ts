import { DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { QueryConfigurationPort } from '../../../application/ports/out/persistence/QueryConfigurationPort';
import { ConfigRequest } from '../../../application/domain/ProxyRequest';
import { EnvironmentVariablesPort, EnvironmentConstants } from '../../../application/ports/out/environment/EnvironmentVariablesPort';

export class DynamoQueryConfiguration implements QueryConfigurationPort {
  private readonly dynamoClient: DynamoDBClient;
  private readonly tableName: string;

  constructor(private readonly environmentVariablesPort: EnvironmentVariablesPort) {
    const region = this.environmentVariablesPort.getRequiredVariable(EnvironmentConstants.AWS_REGION);
    this.tableName = this.environmentVariablesPort.getRequiredVariable(EnvironmentConstants.DYNAMO_TABLE);
    
    this.dynamoClient = new DynamoDBClient({ region });
  }

  async query(id: string, operation: string): Promise<ConfigRequest> {
    try {
      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({
          id,
          operation
        })
      });

      const result = await this.dynamoClient.send(command);
      
      if (!result.Item) {
        throw new Error(`Configuration not found for id: ${id}, operation: ${operation}`);
      }

      const item = unmarshall(result.Item);
      return this.mapToConfigRequest(item);
    } catch (error) {
      console.error('Error querying configuration from DynamoDB:', error);
      throw error;
    }
  }

  async save(config: ConfigRequest): Promise<void> {
    try {
      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: marshall({
          id: config.id,
          operation: config.operation,
          endpoint: config.endpoint,
          method: config.method,
          timeout: config.timeout,
          authType: config.authType,
          headers: config.headers,
          params: config.params,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });

      await this.dynamoClient.send(command);
      console.log(`Configuration saved for id: ${config.id}, operation: ${config.operation}`);
    } catch (error) {
      console.error('Error saving configuration to DynamoDB:', error);
      throw error;
    }
  }

  async delete(id: string, operation: string): Promise<void> {
    try {
      const command = new DeleteItemCommand({
        TableName: this.tableName,
        Key: marshall({
          id,
          operation
        })
      });

      await this.dynamoClient.send(command);
      console.log(`Configuration deleted for id: ${id}, operation: ${operation}`);
    } catch (error) {
      console.error('Error deleting configuration from DynamoDB:', error);
      throw error;
    }
  }

  private mapToConfigRequest(item: any): ConfigRequest {
    return {
      id: item.id,
      operation: item.operation,
      endpoint: item.endpoint,
      method: item.method,
      timeout: item.timeout,
      authType: item.authType,
      headers: item.headers || {},
      params: item.params || {}
    };
  }
}