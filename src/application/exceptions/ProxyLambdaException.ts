export class ProxyLambdaException extends Error {
  public readonly statusCode: number;
  public readonly errorCode?: string;

  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);
    this.name = 'ProxyLambdaException';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProxyLambdaException);
    }
  }
}