import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoQueryConfiguration } from '../../../../src/adapter/out/persistence/DynamoQueryConfiguration';
import { EnvironmentVariablesPort, EnvironmentConstants } from '../../../../src/application/ports/out/environment/EnvironmentVariablesPort';
import { ConfigRequest, HttpMethodType, AuthType } from '../../../../src/application/domain/ProxyRequest';

// Mock AWS SDK
vi.mock('@aws-sdk/client-dynamodb');
vi.mock('@aws-sdk/util-dynamodb');

describe('DynamoQueryConfiguration', () => {
  let dynamoQueryConfiguration: DynamoQueryConfiguration;
  let mockEnvironmentVariablesPort: EnvironmentVariablesPort;
  let mockDynamoClient: DynamoDBClient;

  const mockConfigRequest: ConfigRequest = {
    id: 'test-id',
    operation: 'GET',
    endpoint: 'https://api.example.com/test',
    method: HttpMethodType.GET,
    timeout: 30000,
    authType: AuthType.NONE,
    headers: { 'Content-Type': 'application/json' },
    params: { version: 'v1' }
  };

  beforeEach(() => {
    mockEnvironmentVariablesPort = {
      getVariable: vi.fn(),
      getRequiredVariable: vi.fn(),
      getAllVariables: vi.fn()
    };

    vi.mocked(mockEnvironmentVariablesPort.getRequiredVariable)
      .mockImplementation((key: string) => {
        if (key === EnvironmentConstants.AWS_REGION) return 'us-east-1';
        if (key === EnvironmentConstants.DYNAMO_TABLE) return 'test-table';
        throw new Error(`Unknown environment variable: ${key}`);
      });

    mockDynamoClient = new DynamoDBClient({ region: 'us-east-1' });
    vi.mocked(DynamoDBClient).mockImplementation(() => mockDynamoClient);

    dynamoQueryConfiguration = new DynamoQueryConfiguration(mockEnvironmentVariablesPort);
  });

  describe('query', () => {
    it('should query configuration successfully', async () => {
      // Given
      const mockItem = {
        id: { S: 'test-id' },
        operation: { S: 'GET' },
        endpoint: { S: 'https://api.example.com/test' },
        method: { S: 'GET' },
        timeout: { N: '30000' },
        authType: { S: 'NONE' },
        headers: { M: { 'Content-Type': { S: 'application/json' } } },
        params: { M: { version: { S: 'v1' } } }
      };

      vi.mocked(mockDynamoClient.send).mockResolvedValue({
        Item: mockItem
      });

      vi.mocked(unmarshall).mockReturnValue({
        id: 'test-id',
        operation: 'GET',
        endpoint: 'https://api.example.com/test',
        method: 'GET',
        timeout: 30000,
        authType: 'NONE',
        headers: { 'Content-Type': 'application/json' },
        params: { version: 'v1' }
      });

      // When
      const result = await dynamoQueryConfiguration.query('test-id', 'GET');

      // Then
      expect(result).toEqual(mockConfigRequest);
      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.any(GetItemCommand)
      );
    });

    it('should throw error when configuration not found', async () => {
      // Given
      vi.mocked(mockDynamoClient.send).mockResolvedValue({
        Item: undefined
      });

      // When & Then
      await expect(dynamoQueryConfiguration.query('test-id', 'GET'))
        .rejects.toThrow('Configuration not found for id: test-id, operation: GET');
    });

    it('should handle DynamoDB error', async () => {
      // Given
      const error = new Error('DynamoDB error');
      vi.mocked(mockDynamoClient.send).mockRejectedValue(error);

      // When & Then
      await expect(dynamoQueryConfiguration.query('test-id', 'GET'))
        .rejects.toThrow('DynamoDB error');
    });
  });

  describe('save', () => {
    it('should save configuration successfully', async () => {
      // Given
      vi.mocked(mockDynamoClient.send).mockResolvedValue({});
      vi.mocked(marshall).mockReturnValue({});

      // When
      await dynamoQueryConfiguration.save(mockConfigRequest);

      // Then
      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.any(PutItemCommand)
      );
      expect(marshall).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-id',
          operation: 'GET',
          endpoint: 'https://api.example.com/test',
          method: 'GET',
          timeout: 30000,
          authType: 'NONE',
          headers: { 'Content-Type': 'application/json' },
          params: { version: 'v1' }
        })
      );
    });

    it('should handle save error', async () => {
      // Given
      const error = new Error('Save error');
      vi.mocked(mockDynamoClient.send).mockRejectedValue(error);

      // When & Then
      await expect(dynamoQueryConfiguration.save(mockConfigRequest))
        .rejects.toThrow('Save error');
    });
  });

  describe('delete', () => {
    it('should delete configuration successfully', async () => {
      // Given
      vi.mocked(mockDynamoClient.send).mockResolvedValue({});
      vi.mocked(marshall).mockReturnValue({});

      // When
      await dynamoQueryConfiguration.delete('test-id', 'GET');

      // Then
      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.any(DeleteItemCommand)
      );
      expect(marshall).toHaveBeenCalledWith({
        id: 'test-id',
        operation: 'GET'
      });
    });

    it('should handle delete error', async () => {
      // Given
      const error = new Error('Delete error');
      vi.mocked(mockDynamoClient.send).mockRejectedValue(error);

      // When & Then
      await expect(dynamoQueryConfiguration.delete('test-id', 'GET'))
        .rejects.toThrow('Delete error');
    });
  });
});