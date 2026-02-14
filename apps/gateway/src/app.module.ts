import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envValidationSchema } from '@config/env.validation';
import { TCP_SERVICE } from '@core/tcp.constants';
import { JwtTokenService } from '@core/jwt-token.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { NetworkingService } from './auth/networking.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
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
  controllers: [AuthController],
  providers: [AuthService, NetworkingService, JwtAuthGuard, JwtTokenService]
})
export class AppModule {}
