import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { HealthStatusRto } from '@common/rtos/health-status.rto';
import { SkipRateLimit } from '../rate-limit/rate-limit.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@SkipRateLimit()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @ApiOkResponse({ type: HealthStatusRto })
  liveness(): HealthStatusRto {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOkResponse({ type: HealthStatusRto })
  @ApiServiceUnavailableResponse({ description: 'Dependency is unavailable' })
  readiness(): Promise<HealthStatusRto> {
    return this.healthService.getReadiness();
  }
}
