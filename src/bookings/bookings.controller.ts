import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { BookingQueryDto } from './dto/booking-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { Booking } from './entities/booking.entity';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a public customer booking',
  })
  @ApiCreatedResponse({
    description: 'Booking created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid booking information or booking date',
  })
  @ApiNotFoundResponse({
    description: 'Selected service was not found',
  })
  @ApiConflictResponse({
    description:
      'A booking already exists for the selected service, date, and time',
  })
  create(@Body() createBookingDto: CreateBookingDto): Promise<Booking> {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get bookings with pagination and optional filters',
  })
  @ApiOkResponse({
    description: 'Bookings retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required',
  })
  findAll(
    @Query() query: BookingQueryDto,
  ): ReturnType<BookingsService['findAll']> {
    return this.bookingsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a booking by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking UUID',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Booking retrieved successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid booking UUID',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required',
  })
  @ApiNotFoundResponse({
    description: 'Booking was not found',
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<Booking> {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a booking status',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking UUID',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Booking status updated successfully',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid UUID, invalid status, or cancelled booking completion attempt',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required',
  })
  @ApiNotFoundResponse({
    description: 'Booking was not found',
  })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    return this.bookingsService.updateStatus(id, updateBookingStatusDto);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel a booking',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking UUID',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Booking cancelled successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid booking UUID',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required',
  })
  @ApiNotFoundResponse({
    description: 'Booking was not found',
  })
  cancel(@Param('id', new ParseUUIDPipe()) id: string): Promise<Booking> {
    return this.bookingsService.cancel(id);
  }
}
