import {
  ConflictException,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common';
import { RegisterUserDto } from '@common/dto/register-user.dto';
import { MESSAGE_PATTERNS } from '@common/constants/message-patterns';
import { UserRto } from '@common/rtos/user.rto';
import { UsersListRto } from '@common/rtos/users-list.rto';
import { NetworkingService } from './networking.service';

interface MicroserviceError {
  code?: string;
  message?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly networkingService: NetworkingService) {}

  async register(payload: RegisterUserDto): Promise<UserRto> {
    try {
      return await this.networkingService.send<UserRto, RegisterUserDto>(
        MESSAGE_PATTERNS.AUTH_REGISTER,
        payload
      );
    } catch (error) {
      const microError = this.normalizeMicroserviceError(error);
      if (microError?.code === 'DUPLICATE_EMAIL') {
        throw new ConflictException(microError.message ?? 'Email already registered');
      }
      throw new InternalServerErrorException(microError?.message ?? 'Unable to register user');
    }
  }

  async listUsers(): Promise<UsersListRto> {
    try {
      const users = await this.networkingService.send<UserRto[], {}>(
        MESSAGE_PATTERNS.AUTH_USERS_LIST,
        {}
      );
      return { users };
    } catch (error) {
      const microError = this.normalizeMicroserviceError(error);
      throw new InternalServerErrorException(microError?.message ?? 'Unable to fetch users');
    }
  }

  private normalizeMicroserviceError(error: unknown): MicroserviceError | undefined {
    if (!error || typeof error !== 'object') {
      return undefined;
    }

    const typedError = error as MicroserviceError & { message?: unknown };
    if (typedError.code || typedError.message) {
      return typedError;
    }

    if (typeof typedError.message === 'object' && typedError.message !== null) {
      return typedError.message as MicroserviceError;
    }

    return undefined;
  }
}
