import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: configService.get<string>('AUTH_TCP_HOST'),
      port: Number(configService.get<number>('AUTH_TCP_PORT'))
    }
  });

  await app.startAllMicroservices();
}

void bootstrap();
