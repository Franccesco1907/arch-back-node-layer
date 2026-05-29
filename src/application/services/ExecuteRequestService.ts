import { ExecuteRequestUseCase } from '../ports/in/execute/ExecuteRequestUseCase';
import { ProxyRequest, ProxyResponse } from '../domain/ProxyRequest';
import { BrokerMessage } from '../domain/BrokerMessage';
import { QueryConfigurationPort } from '../ports/out/persistence/QueryConfigurationPort';
import { HttpExecutorPort } from '../ports/out/web/HttpExecutorPort';
import { BrokerMessageSenderPort } from '../ports/out/broker/BrokerMessageSenderPort';
import { EnvironmentVariablesPort } from '../ports/out/environment/EnvironmentVariablesPort';

export class ExecuteRequestService implements ExecuteRequestUseCase {
  constructor(
    private readonly queryConfigurationPort: QueryConfigurationPort,
    private readonly httpExecutorPort: HttpExecutorPort,
    private readonly brokerMessageSenderPort: BrokerMessageSenderPort,
    private readonly environmentVariablesPort: EnvironmentVariablesPort
  ) {}

  async execute(request: ProxyRequest): Promise<ProxyResponse> {
    console.log('Start request service ...');

    const config = await this.queryConfigurationPort.query(request.id, request.operation);

    console.log(`Configuration for id ${request.id}, operation ${request.operation}:`, config);

    const response = await this.httpExecutorPort.executeRequest(request, config);

    await this.sendMessageToBroker(response);

    return response;
  }

  private async sendMessageToBroker(response: ProxyResponse): Promise<void> {
    try {
      const message: BrokerMessage = {
        endpoint: response.fullEndpoint,
        statusCode: response.statusCode,
        timestamp: new Date(),
        success: response.statusCode >= 200 && response.statusCode < 300
      };

      await this.brokerMessageSenderPort.sendMessage(message);
      console.log('Message sent to broker successfully');
    } catch (error) {
      console.error('Error sending message to broker:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }
}