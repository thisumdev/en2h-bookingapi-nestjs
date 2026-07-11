import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Unique email address used to access the system',
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
    description: 'Password containing between 8 and 72 characters',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
