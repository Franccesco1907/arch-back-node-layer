import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { BrokerMessageSenderPort } from '../../../application/ports/out/broker/BrokerMessageSenderPort';
import { BrokerMessage } from '../../../application/domain/BrokerMessage';
import { EnvironmentVariablesPort, EnvironmentConstants } from '../../../application/ports/out/environment/EnvironmentVariablesPort';

export class SqsBrokerMessageSender implements BrokerMessageSenderPort {
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;

  constructor(private readonly environmentVariablesPort: EnvironmentVariablesPort) {
    const region = this.environmentVariablesPort.getRequiredVariable(EnvironmentConstants.AWS_REGION);
    this.queueUrl = this.environmentVariablesPort.getRequiredVariable(EnvironmentConstants.SQS_QUEUE_URL);
    
    this.sqsClient = new SQSClient({ region });
  }

  async sendMessage(message: BrokerMessage): Promise<void> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          endpoint: {
            DataType: 'String',
            StringValue: message.endpoint || 'unknown'
          },
          statusCode: {
            DataType: 'String',
            StringValue: message.statusCode?.toString() || '0'
          },
          success: {
            DataType: 'String',
            StringValue: message.success?.toString() || 'false'
          }
        }
      });

      const result = await this.sqsClient.send(command);
      console.log('Message sent to SQS:', result.MessageId);
    } catch (error) {
      console.error('Error sending message to SQS:', error);
      throw error;
    }
  }
}