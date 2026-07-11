import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'intern.test@example.com',
    description: 'Registered user email address',
  })
  @Transform(({ value }: TransformFnParams) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    return value.trim().toLowerCase();
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    example: 'StrongPassword123',
    description: 'Registered user password',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
