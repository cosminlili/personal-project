import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envValidationSchema } from '@config/env.validation';
import { TCP_SERVICE } from '@core/tcp.constants';
import { JwtTokenService } from '@core/jwt-token.service';
import { LoggingModule } from '@common/logging/logging.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { NetworkingService } from './auth/networking.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    LoggingModule,
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: Number(configService.get('CACHE_TTL_SECONDS'))
      })
    }),
    ClientsModule.registerAsync([
      {
        name: TCP_SERVICE.AUTHENTICATION,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('AUTH_TCP_HOST'),
            port: Number(configService.get<number>('AUTH_TCP_PORT'))
          }
        })
      }
    ])
  ],
  controllers: [AuthController, HealthController],
  providers: [
    AuthService,
    NetworkingService,
    JwtAuthGuard,
    JwtTokenService,
    HealthService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard
    }
  ]
})
export class AppModule {}
