import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TCP_SERVICE } from '@core/tcp.constants';

@Injectable()
export class NetworkingService {
  constructor(
    @Inject(TCP_SERVICE.AUTHENTICATION)
    private readonly client: ClientProxy
  ) {}

  async send<TResponse, TPayload>(pattern: string, payload: TPayload): Promise<TResponse> {
    return firstValueFrom(this.client.send<TResponse, TPayload>(pattern, payload));
  }
}
