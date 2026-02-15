import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from '../src/health/health.service';
import { NetworkingService } from '../src/auth/networking.service';

describe('HealthService', () => {
  it('returns liveness status', () => {
    const service = new HealthService({} as NetworkingService);
    const result = service.getLiveness();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('gateway');
  });

  it('returns readiness status when authentication is healthy', async () => {
    const networkingService: Partial<NetworkingService> = {
      send: jest.fn().mockResolvedValue({ status: 'ok' })
    };

    const service = new HealthService(networkingService as NetworkingService);
    const result = await service.getReadiness();

    expect(result.status).toBe('ok');
    expect(result.authentication).toBe('up');
  });

  it('throws service unavailable exception when dependency is down', async () => {
    const networkingService: Partial<NetworkingService> = {
      send: jest.fn().mockRejectedValue(new Error('tcp down'))
    };

    const service = new HealthService(networkingService as NetworkingService);

    await expect(service.getReadiness()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
