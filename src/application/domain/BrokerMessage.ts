export interface BrokerMessage {
  endpoint?: string;
  statusCode?: number;
  responseTime?: number;
  timestamp?: Date;
  requestId?: string;
  operation?: string;
  success?: boolean;
  errorMessage?: string;
}