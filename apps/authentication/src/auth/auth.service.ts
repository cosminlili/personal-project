import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from '@common/dto/register-user.dto';
import { UserRto } from '@common/rtos/user.rto';
import { UserRepository } from './user.repository';
import { User } from './user.schema';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(payload: RegisterUserDto): Promise<UserRto> {
    try {
      const passwordHash = await bcrypt.hash(payload.password, 10);
      const user = await this.userRepository.create(payload.email, passwordHash);
      return this.toUserRto(user);
    } catch (error) {
      const err = error as { code?: number };
      if (err?.code === 11000) {
        throw new RpcException({ code: 'DUPLICATE_EMAIL', message: 'Email already registered' });
      }
      throw new RpcException({ code: 'REGISTER_FAILED', message: 'Unable to register user' });
    }
  }

  async listUsers(): Promise<UserRto[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => this.toUserRto(user));
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
