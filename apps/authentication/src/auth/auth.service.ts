import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from '@common/dto/register-user.dto';
import { LoginUserDto } from '@common/dto/login-user.dto';
import { UserRto } from '@common/rtos/user.rto';
import { AuthTokenRto } from '@common/rtos/auth-token.rto';
import { HealthStatusRto } from '@common/rtos/health-status.rto';
import { CentralLoggerService } from '@common/logging/central-logger.service';
import { JwtTokenService } from '@core/jwt-token.service';
import { UserRepository } from './user.repository';
import { User } from './user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly logger: CentralLoggerService
  ) {}

  async register(payload: RegisterUserDto): Promise<UserRto> {
    try {
      const passwordHash = await bcrypt.hash(payload.password, 10);
      const user = await this.userRepository.create(payload.email, passwordHash);
      this.logger.log('User registered', 'AuthService', { email: payload.email });
      return this.toUserRto(user);
    } catch (error) {
      const err = error as { code?: number };
      if (err?.code === 11000) {
        this.logger.warn('Duplicate email registration attempt', 'AuthService', {
          email: payload.email
        });
        throw new RpcException({ code: 'DUPLICATE_EMAIL', message: 'Email already registered' });
      }
      this.logger.error('User registration failed', 'AuthService', error, { email: payload.email });
      throw new RpcException({ code: 'REGISTER_FAILED', message: 'Unable to register user' });
    }
  }

  async login(payload: LoginUserDto): Promise<AuthTokenRto> {
    const user = await this.userRepository.findByEmail(payload.email);
    if (!user) {
      this.logger.warn('Login failed: missing user', 'AuthService', { email: payload.email });
      throw new RpcException({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);
    if (!passwordMatches) {
      this.logger.warn('Login failed: invalid password', 'AuthService', { email: payload.email });
      throw new RpcException({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    const expiresIn = this.configService.getOrThrow<string>('JWT_EXPIRES_IN');

    this.logger.log('User authenticated', 'AuthService', { email: payload.email });
    return {
      accessToken: this.jwtTokenService.sign(
        { sub: user._id.toString(), email: user.email },
        jwtSecret,
        expiresIn
      )
    };
  }

  async listUsers(): Promise<UserRto[]> {
    const users = await this.userRepository.findAll();
    this.logger.debug('Users list fetched', 'AuthService', { total: users.length });
    return users.map((user) => this.toUserRto(user));
  }

  async healthCheck(): Promise<HealthStatusRto> {
    try {
      const isDatabaseReady = await this.userRepository.isDatabaseReady();

      return {
        status: isDatabaseReady ? 'ok' : 'error',
        service: 'authentication',
        database: isDatabaseReady ? 'up' : 'down',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Authentication readiness check failed', 'AuthService', error);
      throw new RpcException({ code: 'HEALTH_CHECK_FAILED', message: 'Authentication service is not ready' });
    }
  }

  private toUserRto(user: User): UserRto {
    return {
      id: user._id.toString(),
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }
}
