import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { JwtTokenService } from '@core/jwt-token.service';
import { CentralLoggerService } from '@common/logging/central-logger.service';
import { AuthService } from '../src/auth/auth.service';
import { UserRepository } from '../src/auth/user.repository';

describe('AuthService', () => {
  const mockConfigService: Partial<ConfigService> = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') {
        return 'test-jwt-secret-test-jwt-secret-123';
      }
      if (key === 'JWT_EXPIRES_IN') {
        return '1h';
      }
      throw new Error('Missing key');
    })
  };

  it('registers a user and returns an RTO', async () => {
    const mockRepository: Partial<UserRepository> = {
      create: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z')
      }),
      isDatabaseReady: jest.fn().mockResolvedValue(true)
    };

    const service = new AuthService(
      mockRepository as UserRepository,
      mockConfigService as ConfigService,
      new JwtTokenService(),
      { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as unknown as CentralLoggerService
    );

    const result = await service.register({
      email: 'user@example.com',
      password: 'password123'
    });

    expect(result).toEqual({
      id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    });
  });

  it('returns an access token on login', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const mockRepository: Partial<UserRepository> = {
      findByEmail: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        passwordHash
      }),
      isDatabaseReady: jest.fn().mockResolvedValue(true)
    };

    const service = new AuthService(
      mockRepository as UserRepository,
      mockConfigService as ConfigService,
      new JwtTokenService(),
      { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as unknown as CentralLoggerService
    );

    const result = await service.login({
      email: 'user@example.com',
      password: 'password123'
    });

    expect(result.accessToken).toBeDefined();
  });

  it('throws rpc exception when credentials are invalid', async () => {
    const mockRepository: Partial<UserRepository> = {
      findByEmail: jest.fn().mockResolvedValue(null),
      isDatabaseReady: jest.fn().mockResolvedValue(true)
    };

    const service = new AuthService(
      mockRepository as UserRepository,
      mockConfigService as ConfigService,
      new JwtTokenService(),
      { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as unknown as CentralLoggerService
    );

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'password123'
      })
    ).rejects.toBeInstanceOf(RpcException);
  });

  it('returns healthy status when database is ready', async () => {
    const mockRepository: Partial<UserRepository> = {
      isDatabaseReady: jest.fn().mockResolvedValue(true)
    };

    const service = new AuthService(
      mockRepository as UserRepository,
      mockConfigService as ConfigService,
      new JwtTokenService(),
      { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as unknown as CentralLoggerService
    );

    const result = await service.healthCheck();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
    expect(result.service).toBe('authentication');
  });
});
