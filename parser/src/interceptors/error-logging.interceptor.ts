import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const handler = context.getHandler();
        const className = context.getClass().name;
        const methodName = handler.name;

        this.logger.error(`Error in ${className}.${methodName}(): ${error.message}`);
        this.logger.error(`Request: ${request.method} ${request.url}`);
        this.logger.error('Full Stack Trace:');
        this.logger.error(error.stack);

        return throwError(() => error);
      })
    );
  }
}
