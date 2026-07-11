import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const trimString = ({ value }: TransformFnParams): unknown => {
  const input: unknown = value;

  return typeof input === 'string' ? input.trim() : input;
};

const normalizeEmail = ({ value }: TransformFnParams): unknown => {
  const input: unknown = value;

  return typeof input === 'string' ? input.trim().toLowerCase() : input;
};

export class CreateBookingDto {
  @ApiProperty({
    example: 'Kamal Perera',
    maxLength: 150,
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  customerName!: string;

  @ApiProperty({
    example: 'kamal@example.com',
    maxLength: 255,
  })
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(255)
  customerEmail!: string;

  @ApiProperty({
    example: '+94 77 123 4567',
    maxLength: 30,
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  customerPhone!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  serviceId!: string;

  @ApiProperty({
    example: '2026-07-20',
    description: 'Booking date in YYYY-MM-DD format',
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: 'bookingDate must be in YYYY-MM-DD format',
  })
  bookingDate!: string;

  @ApiProperty({
    example: '14:30',
    description: 'Booking time in 24-hour HH:mm format',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'bookingTime must be in 24-hour HH:mm format',
  })
  bookingTime!: string;

  @ApiPropertyOptional({
    example: 'Please call before the appointment',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  notes?: string;
}
