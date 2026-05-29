import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DependencyInjection } from './infrastructure/config/DependencyInjection';

const dependencyInjection = DependencyInjection.getInstance();
const proxyLambdaHandler = dependencyInjection.getProxyLambdaHandler();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await proxyLambdaHandler.handleRequest(event, context);
};