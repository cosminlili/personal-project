import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { CentralLoggerService } from './central-logger.service';

interface PatternContext {
  getPattern?: () => string;
}

@Injectable()
export class RpcLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CentralLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'rpc') {
      return next.handle();
    }

    const rpcContext = context.switchToRpc().getContext<PatternContext>();
    const pattern = rpcContext?.getPattern?.() ?? context.getHandler().name;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log('RPC message processed', 'RpcLoggingInterceptor', {
            pattern,
            durationMs: Date.now() - startedAt
          });
        },
        error: (error: unknown) => {
          this.logger.error('RPC message failed', 'RpcLoggingInterceptor', error, {
            pattern,
            durationMs: Date.now() - startedAt
          });
        }
      })
    );
  }
}
