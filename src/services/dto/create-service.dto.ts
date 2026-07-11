import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Full Body Massage',
    description: 'Name of the service',
    maxLength: 150,
  })
  @Transform(({ value }: TransformFnParams) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    return value.trim();
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiProperty({
    example: 'A relaxing full body massage session.',
    description: 'Detailed description of the service',
  })
  @Transform(({ value }: TransformFnParams) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    return value.trim();
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    example: 60,
    description: 'Service duration in minutes',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  duration!: number;

  @ApiProperty({
    example: 4500,
    description: 'Service price with a maximum of two decimal places',
    minimum: 0,
  })
  @IsNumber({
    allowInfinity: false,
    allowNaN: false,
    maxDecimalPlaces: 2,
  })
  @Min(0)
  @Max(99999999.99)
  price!: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the service is currently active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
