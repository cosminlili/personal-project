import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TCP_SERVICE } from '@core/tcp.constants';
import { CentralLoggerService } from '@common/logging/central-logger.service';

@Injectable()
export class NetworkingService {
  constructor(
    @Inject(TCP_SERVICE.AUTHENTICATION)
    private readonly client: ClientProxy,
    private readonly logger: CentralLoggerService
  ) {}

  async send<TResponse, TPayload>(pattern: string, payload: TPayload): Promise<TResponse> {
    const startedAt = Date.now();

    try {
      const response = await firstValueFrom(this.client.send<TResponse, TPayload>(pattern, payload));
      this.logger.debug('TCP message sent successfully', 'NetworkingService', {
        pattern,
        durationMs: Date.now() - startedAt
      });
      return response;
    } catch (error) {
      this.logger.error('TCP message failed', 'NetworkingService', error, {
        pattern,
        durationMs: Date.now() - startedAt
      });
      throw error;
    }
  }
}
