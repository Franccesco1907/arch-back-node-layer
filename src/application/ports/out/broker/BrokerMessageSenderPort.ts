import { BrokerMessage } from '../../../domain/BrokerMessage';

export interface BrokerMessageSenderPort {
  sendMessage(message: BrokerMessage): Promise<void>;
}