import { ConfigRequest } from '../../../domain/ProxyRequest';

export interface QueryConfigurationPort {
  query(id: string, operation: string): Promise<ConfigRequest>;
  save(config: ConfigRequest): Promise<void>;
  delete(id: string, operation: string): Promise<void>;
}