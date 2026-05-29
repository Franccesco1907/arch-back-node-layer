import { ProxyRequest, ProxyResponse, ConfigRequest } from '../../../domain/ProxyRequest';

export interface HttpExecutorPort {
  executeRequest(request: ProxyRequest, config: ConfigRequest): Promise<ProxyResponse>;
}