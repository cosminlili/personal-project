import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CentralLoggerService } from './central-logger.service';
import { HttpLoggingInterceptor } from './http-logging.interceptor';
import { RpcLoggingInterceptor } from './rpc-logging.interceptor';

@Global()
@Module({
  providers: [
    CentralLoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RpcLoggingInterceptor
    }
  ],
  exports: [CentralLoggerService]
})
export class LoggingModule {}
