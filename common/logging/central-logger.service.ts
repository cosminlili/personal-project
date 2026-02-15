import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CentralLoggerService {
  private readonly logger = new Logger('CentralLogger');

  log(message: string, context: string, metadata?: Record<string, unknown>): void {
    this.logger.log(this.stringify(message, metadata), context);
  }

  warn(message: string, context: string, metadata?: Record<string, unknown>): void {
    this.logger.warn(this.stringify(message, metadata), context);
  }

  error(message: string, context: string, error?: unknown, metadata?: Record<string, unknown>): void {
    const trace = error instanceof Error ? error.stack : undefined;
    this.logger.error(this.stringify(message, metadata), trace, context);
  }

  debug(message: string, context: string, metadata?: Record<string, unknown>): void {
    this.logger.debug(this.stringify(message, metadata), context);
  }

  private stringify(message: string, metadata?: Record<string, unknown>): string {
    if (!metadata || Object.keys(metadata).length === 0) {
      return message;
    }

    return `${message} ${JSON.stringify(metadata)}`;
  }
}
