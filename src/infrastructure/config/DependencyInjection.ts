import type { ExecuteRequestUseCase } from '../../application/ports/in/execute/ExecuteRequestUseCase';
import type { CreateUserUseCase } from '../../application/ports/in/user/CreateUserUseCase';
import { ExecuteRequestService } from '../../application/services/ExecuteRequestService';
import { UserService } from '../../application/services/UserService';
import type { QueryConfigurationPort } from '../../application/ports/out/persistence/QueryConfigurationPort';
import type { UserRepositoryPort } from '../../application/ports/out/persistence/UserRepositoryPort';
import type { HttpExecutorPort } from '../../application/ports/out/web/HttpExecutorPort';
import type { BrokerMessageSenderPort } from '../../application/ports/out/broker/BrokerMessageSenderPort';
import type { EnvironmentVariablesPort } from '../../application/ports/out/environment/EnvironmentVariablesPort';
import { EnvironmentConstants } from '../../application/ports/out/environment/EnvironmentVariablesPort';
import type { SecretManagerPort } from '../../application/ports/out/secretmanager/SecretManagerPort';

import { DynamoQueryConfiguration } from '../../adapter/out/persistence/DynamoQueryConfiguration';
import { HttpClientExecutor } from '../../adapter/out/web/HttpClientExecutor';
import { SqsBrokerMessageSender } from '../../adapter/out/broker/SqsBrokerMessageSender';
import { SystemEnvironmentVariables } from '../../adapter/out/environment/SystemEnvironmentVariables';
import { AwsSecretManager } from '../../adapter/out/secretmanager/AwsSecretManager';
import { ProxyLambdaHandler } from '../../adapter/in/lambda/ProxyLambdaHandler';
import { InMemoryUserRepository } from '../../adapter/out/persistence/user/InMemoryUserRepository';
import { DynamoUserRepository } from '../../adapter/out/persistence/user/DynamoUserRepository';

export class DependencyInjection {
  private static instance: DependencyInjection;
  
  private readonly environmentVariablesPort: EnvironmentVariablesPort;
  private readonly userRepositoryPort: UserRepositoryPort;
  private readonly createUserUseCase: CreateUserUseCase;
  private secretManagerPort?: SecretManagerPort;
  private queryConfigurationPort?: QueryConfigurationPort;
  private httpExecutorPort?: HttpExecutorPort;
  private brokerMessageSenderPort?: BrokerMessageSenderPort;
  private executeRequestUseCase?: ExecuteRequestUseCase;
  private proxyLambdaHandler?: ProxyLambdaHandler;

  private constructor() {
    // Initialize adapters
    this.environmentVariablesPort = new SystemEnvironmentVariables();
    this.userRepositoryPort = this.createUserRepository();
    this.createUserUseCase = new UserService(this.userRepositoryPort);
  }

  static getInstance(): DependencyInjection {
    if (!DependencyInjection.instance) {
      DependencyInjection.instance = new DependencyInjection();
    }
    return DependencyInjection.instance;
  }

  getProxyLambdaHandler(): ProxyLambdaHandler {
    if (!this.proxyLambdaHandler) {
      this.proxyLambdaHandler = new ProxyLambdaHandler(this.getExecuteRequestUseCase());
    }

    return this.proxyLambdaHandler;
  }

  getExecuteRequestUseCase(): ExecuteRequestUseCase {
    if (!this.executeRequestUseCase) {
      this.executeRequestUseCase = new ExecuteRequestService(
        this.getQueryConfigurationPort(),
        this.getHttpExecutorPort(),
        this.getBrokerMessageSenderPort(),
        this.environmentVariablesPort
      );
    }

    return this.executeRequestUseCase;
  }

  getCreateUserUseCase(): CreateUserUseCase {
    return this.createUserUseCase;
  }

  getEnvironmentVariablesPort(): EnvironmentVariablesPort {
    return this.environmentVariablesPort;
  }

  getSecretManagerPort(): SecretManagerPort {
    if (!this.secretManagerPort) {
      this.secretManagerPort = new AwsSecretManager(this.environmentVariablesPort);
    }

    return this.secretManagerPort;
  }

  getQueryConfigurationPort(): QueryConfigurationPort {
    if (!this.queryConfigurationPort) {
      this.queryConfigurationPort = new DynamoQueryConfiguration(this.environmentVariablesPort);
    }

    return this.queryConfigurationPort;
  }

  getHttpExecutorPort(): HttpExecutorPort {
    if (!this.httpExecutorPort) {
      this.httpExecutorPort = new HttpClientExecutor(this.getSecretManagerPort(), this.environmentVariablesPort);
    }

    return this.httpExecutorPort;
  }

  getBrokerMessageSenderPort(): BrokerMessageSenderPort {
    if (!this.brokerMessageSenderPort) {
      this.brokerMessageSenderPort = new SqsBrokerMessageSender(this.environmentVariablesPort);
    }

    return this.brokerMessageSenderPort;
  }

  getUserRepositoryPort(): UserRepositoryPort {
    return this.userRepositoryPort;
  }

  private createUserRepository(): UserRepositoryPort {
    const usersTable = this.environmentVariablesPort.getVariable(EnvironmentConstants.USERS_TABLE);

    if (!usersTable) {
      return new InMemoryUserRepository();
    }

    const region = this.environmentVariablesPort.getVariable(EnvironmentConstants.AWS_REGION) || 'us-east-1';
    return new DynamoUserRepository(usersTable, region);
  }
}
