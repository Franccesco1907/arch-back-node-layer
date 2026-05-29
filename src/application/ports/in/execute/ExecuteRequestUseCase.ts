import { ProxyRequest, ProxyResponse } from '../../../domain/ProxyRequest';

export interface ExecuteRequestUseCase {
  execute(request: ProxyRequest): Promise<ProxyResponse>;
}