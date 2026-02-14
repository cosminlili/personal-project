import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { RegisterUserDto } from '@common/dto/register-user.dto';
import { LoginUserDto } from '@common/dto/login-user.dto';
import { UserRto } from '@common/rtos/user.rto';
import { UsersListRto } from '@common/rtos/users-list.rto';
import { AuthTokenRto } from '@common/rtos/auth-token.rto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({ type: UserRto })
  async register(@Body() payload: RegisterUserDto): Promise<UserRto> {
    return this.authService.register(payload);
  }

  @Post('login')
  @ApiOkResponse({ type: AuthTokenRto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() payload: LoginUserDto): Promise<AuthTokenRto> {
    return this.authService.login(payload);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UsersListRto })
  async listUsers(): Promise<UsersListRto> {
    return this.authService.listUsers();
  }
}
