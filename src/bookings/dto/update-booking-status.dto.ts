import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { BookingStatus } from '../enums/booking-status.enum';

const ALLOWED_STATUS_UPDATES = [
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
] as const;

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: ALLOWED_STATUS_UPDATES,
    example: BookingStatus.CONFIRMED,
    description:
      'New booking status. Use the dedicated cancel endpoint to cancel a booking.',
  })
  @IsIn(ALLOWED_STATUS_UPDATES)
  status!: BookingStatus.CONFIRMED | BookingStatus.COMPLETED;
}
