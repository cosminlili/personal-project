import { ApiProperty } from '@nestjs/swagger';
import { UserRto } from './user.rto';

export class UsersListRto {
  @ApiProperty({ type: [UserRto] })
  users!: UserRto[];
}
