import { ApiProperty } from '@nestjs/swagger';

export class AuthTokenRto {
  @ApiProperty()
  accessToken!: string;
}
