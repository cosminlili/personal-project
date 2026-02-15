import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { MESSAGE_PATTERNS } from '@common/constants/message-patterns';
import { HealthStatusRto } from '@common/rtos/health-status.rto';
import { NetworkingService } from '../auth/networking.service';

@Injectable()
export class HealthService {
  constructor(private readonly networkingService: NetworkingService) {}

  getLiveness(): HealthStatusRto {
    return {
      status: 'ok',
      service: 'gateway',
      timestamp: new Date().toISOString()
    };
  }

  async getReadiness(): Promise<HealthStatusRto> {
    try {
      const authHealth = await this.networkingService.send<HealthStatusRto, {}>(
        MESSAGE_PATTERNS.AUTH_HEALTH,
        {}
      );

      return {
        status: authHealth.status === 'ok' ? 'ok' : 'error',
        service: 'gateway',
        authentication: authHealth.status === 'ok' ? 'up' : 'down',
        timestamp: new Date().toISOString()
      };
    } catch (_error) {
      throw new ServiceUnavailableException('Authentication service is not ready');
    }
  }
}
