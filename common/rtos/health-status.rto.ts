import { ApiProperty } from '@nestjs/swagger';

export class HealthStatusRto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok' | 'error';

  @ApiProperty({ example: 'gateway' })
  service!: string;

  @ApiProperty({ example: 'up' })
  database?: 'up' | 'down';

  @ApiProperty({ example: 'up' })
  authentication?: 'up' | 'down';

  @ApiProperty({ example: '2026-02-14T12:00:00.000Z' })
  timestamp!: string;
}
