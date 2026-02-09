import { Body, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { RegisterUserDto } from '@common/dto/register-user.dto';
import { UserRto } from '@common/rtos/user.rto';
import { UsersListRto } from '@common/rtos/users-list.rto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({ type: UserRto })
  async register(@Body() payload: RegisterUserDto): Promise<UserRto> {
    return this.authService.register(payload);
  }

  @Get('users')
  @UseInterceptors(CacheInterceptor)
  @ApiOkResponse({ type: UsersListRto })
  async listUsers(): Promise<UsersListRto> {
    return this.authService.listUsers();
  }
}
