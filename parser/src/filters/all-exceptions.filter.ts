import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof Error ? exception.message : 'Unknown error';

    // Логируем полную информацию об ошибке
    this.logger.error(`Exception caught: ${message}`);
    this.logger.error(`Request URL: ${request.url}`);
    this.logger.error(`Request Method: ${request.method}`);
    
    if (exception instanceof Error) {
      this.logger.error('Full Stack Trace:');
      this.logger.error(exception.stack);
    } else {
      this.logger.error('Exception object:', exception);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    response.status(status).json(errorResponse);
  }
}
