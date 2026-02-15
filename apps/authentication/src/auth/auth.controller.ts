import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RegisterUserDto } from '@common/dto/register-user.dto';
import { LoginUserDto } from '@common/dto/login-user.dto';
import { MESSAGE_PATTERNS } from '@common/constants/message-patterns';
import { UserRto } from '@common/rtos/user.rto';
import { AuthTokenRto } from '@common/rtos/auth-token.rto';
import { HealthStatusRto } from '@common/rtos/health-status.rto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(MESSAGE_PATTERNS.AUTH_REGISTER)
  async register(payload: RegisterUserDto): Promise<UserRto> {
    return this.authService.register(payload);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH_LOGIN)
  async login(payload: LoginUserDto): Promise<AuthTokenRto> {
    return this.authService.login(payload);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH_USERS_LIST)
  async listUsers(): Promise<UserRto[]> {
    return this.authService.listUsers();
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH_HEALTH)
  async healthCheck(): Promise<HealthStatusRto> {
    return this.authService.healthCheck();
  }
}
