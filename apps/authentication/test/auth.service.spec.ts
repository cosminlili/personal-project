import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { JwtTokenService } from '@core/jwt-token.service';
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
      })
    };

    const service = new AuthService(
      mockRepository as UserRepository,
      mockConfigService as ConfigService,
      new JwtTokenService()
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
      })
    };

    const service = new AuthService(
      mockRepository as UserRepository,
      mockConfigService as ConfigService,
      new JwtTokenService()
    );

    const result = await service.login({
      email: 'user@example.com',
      password: 'password123'
    });

    expect(result.accessToken).toBeDefined();
  });

  it('throws rpc exception when credentials are invalid', async () => {
    const mockRepository: Partial<UserRepository> = {
      findByEmail: jest.fn().mockResolvedValue(null)
    };

    const service = new AuthService(
      mockRepository as UserRepository,
      mockConfigService as ConfigService,
      new JwtTokenService()
    );

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'password123'
      })
    ).rejects.toBeInstanceOf(RpcException);
  });
});
