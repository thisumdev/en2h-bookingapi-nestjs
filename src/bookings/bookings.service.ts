import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { ServicesService } from '../services/services.service';
import { BookingQueryDto } from './dto/booking-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from './enums/booking-status.enum';

interface PaginatedBookings {
  data: Booking[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

function hasDatabaseErrorCode(error: unknown): error is { code: string } {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  return typeof error.code === 'string';
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly servicesService: ServicesService,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    await this.servicesService.findOne(createBookingDto.serviceId);

    this.validateBookingDate(createBookingDto.bookingDate);

    const existingBooking = await this.bookingsRepository.findOne({
      where: {
        serviceId: createBookingDto.serviceId,
        bookingDate: createBookingDto.bookingDate,
        bookingTime: createBookingDto.bookingTime,
      },
    });

    if (existingBooking) {
      throw new ConflictException(
        'A booking already exists for this service, date, and time',
      );
    }

    const booking = this.bookingsRepository.create({
      ...createBookingDto,
      status: BookingStatus.PENDING,
    });

    try {
      return await this.bookingsRepository.save(booking);
    } catch (error: unknown) {
      if (hasDatabaseErrorCode(error) && error.code === '23505') {
        throw new ConflictException(
          'A booking already exists for this service, date, and time',
        );
      }

      throw error;
    }
  }

  async findAll(query: BookingQueryDto): Promise<PaginatedBookings> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const { search, status } = query;

    const statusCondition: FindOptionsWhere<Booking> = status ? { status } : {};

    const where: FindOptionsWhere<Booking> | FindOptionsWhere<Booking>[] =
      search
        ? [
            {
              ...statusCondition,
              customerName: ILike(`%${search}%`),
            },
            {
              ...statusCondition,
              customerEmail: ILike(`%${search}%`),
            },
            {
              ...statusCondition,
              customerPhone: ILike(`%${search}%`),
            },
          ]
        : statusCondition;

    const [bookings, totalItems] = await this.bookingsRepository.findAndCount({
      where,
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: bookings,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: {
        service: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateStatus(
    id: string,
    updateBookingStatusDto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    const booking = await this.findOne(id);

    if (
      booking.status === BookingStatus.CANCELLED &&
      updateBookingStatusDto.status === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Cancelled bookings cannot be marked as completed',
      );
    }

    booking.status = updateBookingStatusDto.status;

    return this.bookingsRepository.save(booking);
  }

  async cancel(id: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.status === BookingStatus.CANCELLED) {
      return booking;
    }

    booking.status = BookingStatus.CANCELLED;

    return this.bookingsRepository.save(booking);
  }

  private validateBookingDate(bookingDate: string): void {
    const dateParts = bookingDate.split('-');

    const year = Number(dateParts[0]);
    const month = Number(dateParts[1]);
    const day = Number(dateParts[2]);

    const parsedBookingDate = new Date(year, month - 1, day);

    const isValidDate =
      parsedBookingDate.getFullYear() === year &&
      parsedBookingDate.getMonth() === month - 1 &&
      parsedBookingDate.getDate() === day;

    if (!isValidDate) {
      throw new BadRequestException('bookingDate must be a valid date');
    }

    parsedBookingDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedBookingDate < today) {
      throw new BadRequestException('Booking date cannot be in the past');
    }
  }
}
