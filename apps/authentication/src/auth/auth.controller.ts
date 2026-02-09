import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RegisterUserDto } from '@common/dto/register-user.dto';
import { MESSAGE_PATTERNS } from '@common/constants/message-patterns';
import { UserRto } from '@common/rtos/user.rto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(MESSAGE_PATTERNS.AUTH_REGISTER)
  async register(payload: RegisterUserDto): Promise<UserRto> {
    return this.authService.register(payload);
  }

  @MessagePattern(MESSAGE_PATTERNS.AUTH_USERS_LIST)
  async listUsers(): Promise<UserRto[]> {
    return this.authService.listUsers();
  }
}
