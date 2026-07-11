import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BookingStatus } from '../enums/booking-status.enum';

const trimString = ({ value }: TransformFnParams): unknown => {
  const input: unknown = value;

  return typeof input === 'string' ? input.trim() : input;
};

const transformToNumber = ({ value }: TransformFnParams): unknown => {
  const input: unknown = value;

  if (typeof input === 'number') {
    return input;
  }

  if (typeof input === 'string' && input.trim() !== '') {
    return Number(input);
  }

  return input;
};

export class BookingQueryDto {
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    default: 1,
    minimum: 1,
    description: 'Page number',
  })
  @Transform(transformToNumber)
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
    description: 'Number of bookings per page',
  })
  @Transform(transformToNumber)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({
    type: String,
    example: 'kamal',
    description: 'Search by customer name, customer email, or customer phone',
    maxLength: 255,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({
    type: String,
    enum: BookingStatus,
    example: BookingStatus.PENDING,
    description: 'Filter bookings by status',
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
