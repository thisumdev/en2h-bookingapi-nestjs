import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepPartial, FindManyOptions, FindOneOptions } from 'typeorm';
import { ServicesService } from '../services/services.service';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from './enums/booking-status.enum';

type BookingsRepositoryMock = {
  findOne: jest.MockedFunction<
    (options: FindOneOptions<Booking>) => Promise<Booking | null>
  >;
  findAndCount: jest.MockedFunction<
    (options?: FindManyOptions<Booking>) => Promise<[Booking[], number]>
  >;
  create: jest.MockedFunction<(entityLike: DeepPartial<Booking>) => Booking>;
  save: jest.MockedFunction<(booking: Booking) => Promise<Booking>>;
};

type ServicesServiceMock = {
  findOne: jest.MockedFunction<ServicesService['findOne']>;
};

type ServiceResult = Awaited<ReturnType<ServicesService['findOne']>>;

describe('BookingsService', () => {
  let bookingsService: BookingsService;
  let bookingsRepository: BookingsRepositoryMock;
  let servicesService: ServicesServiceMock;

  const serviceId = '8ebcd336-c898-44f2-aad9-05931ad90be6';
  const bookingId = '6d8bdd0c-b806-4e56-996b-b0d183325d45';

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return formatDate(tomorrow);
  };

  const createServiceEntity = (): ServiceResult =>
    ({
      id: serviceId,
      title: 'Haircut',
      description: 'Professional haircut service',
      duration: 30,
      price: '2500.00',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as ServiceResult;

  const createBookingDto = (
    overrides: Partial<CreateBookingDto> = {},
  ): CreateBookingDto => ({
    customerName: 'Kamal Perera',
    customerEmail: 'kamal@example.com',
    customerPhone: '+94 77 123 4567',
    serviceId,
    bookingDate: getTomorrowDate(),
    bookingTime: '14:30',
    notes: 'Please call before the appointment',
    ...overrides,
  });

  const createBookingEntity = (overrides: Partial<Booking> = {}): Booking =>
    Object.assign(
      {} as Booking,
      {
        id: bookingId,
        customerName: 'Kamal Perera',
        customerEmail: 'kamal@example.com',
        customerPhone: '+94 77 123 4567',
        serviceId,
        bookingDate: getTomorrowDate(),
        bookingTime: '14:30',
        status: BookingStatus.PENDING,
        notes: 'Please call before the appointment',
        service: createServiceEntity(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      overrides,
    );

  beforeEach(async () => {
    bookingsRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    servicesService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: bookingsRepository,
        },
        {
          provide: ServicesService,
          useValue: servicesService,
        },
      ],
    }).compile();

    bookingsService = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a booking with PENDING status', async () => {
      const dto = createBookingDto();
      const savedBooking = createBookingEntity();

      servicesService.findOne.mockResolvedValue(createServiceEntity());
      bookingsRepository.findOne.mockResolvedValue(null);
      bookingsRepository.create.mockImplementation((entityLike) =>
        Object.assign({} as Booking, entityLike),
      );
      bookingsRepository.save.mockResolvedValue(savedBooking);

      const result = await bookingsService.create(dto);

      expect(servicesService.findOne).toHaveBeenCalledWith(serviceId);
      expect(bookingsRepository.findOne).toHaveBeenCalledWith({
        where: {
          serviceId,
          bookingDate: dto.bookingDate,
          bookingTime: dto.bookingTime,
        },
      });
      expect(bookingsRepository.create).toHaveBeenCalledWith({
        ...dto,
        status: BookingStatus.PENDING,
      });
      expect(result).toEqual(savedBooking);
    });

    it('should reject a booking when the service does not exist', async () => {
      const dto = createBookingDto();

      servicesService.findOne.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(bookingsService.create(dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(bookingsRepository.findOne).not.toHaveBeenCalled();
      expect(bookingsRepository.save).not.toHaveBeenCalled();
    });

    it('should reject a booking date in the past', async () => {
      const dto = createBookingDto({
        bookingDate: '2000-01-01',
      });

      servicesService.findOne.mockResolvedValue(createServiceEntity());

      await expect(bookingsService.create(dto)).rejects.toThrow(
        BadRequestException,
      );

      expect(bookingsRepository.findOne).not.toHaveBeenCalled();
      expect(bookingsRepository.save).not.toHaveBeenCalled();
    });

    it('should reject a duplicate booking', async () => {
      const dto = createBookingDto();

      servicesService.findOne.mockResolvedValue(createServiceEntity());
      bookingsRepository.findOne.mockResolvedValue(createBookingEntity());

      await expect(bookingsService.create(dto)).rejects.toThrow(
        ConflictException,
      );

      expect(bookingsRepository.create).not.toHaveBeenCalled();
      expect(bookingsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated bookings', async () => {
      const booking = createBookingEntity();

      bookingsRepository.findAndCount.mockResolvedValue([[booking], 1]);

      const result = await bookingsService.findAll({
        page: 1,
        limit: 10,
      });

      expect(bookingsRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        order: {
          createdAt: 'DESC',
        },
        skip: 0,
        take: 10,
      });

      expect(result).toEqual({
        data: [booking],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a booking by ID', async () => {
      const booking = createBookingEntity();

      bookingsRepository.findOne.mockResolvedValue(booking);

      const result = await bookingsService.findOne(bookingId);

      expect(bookingsRepository.findOne).toHaveBeenCalledWith({
        where: { id: bookingId },
        relations: {
          service: true,
        },
      });
      expect(result).toEqual(booking);
    });

    it('should return 404 when the booking does not exist', async () => {
      bookingsRepository.findOne.mockResolvedValue(null);

      await expect(bookingsService.findOne(bookingId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update the booking status', async () => {
      const booking = createBookingEntity();
      const dto: UpdateBookingStatusDto = {
        status: BookingStatus.CONFIRMED,
      };

      bookingsRepository.findOne.mockResolvedValue(booking);
      bookingsRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await bookingsService.updateStatus(bookingId, dto);

      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(bookingsRepository.save).toHaveBeenCalledWith(booking);
    });

    it('should prevent a cancelled booking from becoming completed', async () => {
      const booking = createBookingEntity({
        status: BookingStatus.CANCELLED,
      });

      const dto: UpdateBookingStatusDto = {
        status: BookingStatus.COMPLETED,
      };

      bookingsRepository.findOne.mockResolvedValue(booking);

      await expect(
        bookingsService.updateStatus(bookingId, dto),
      ).rejects.toThrow(BadRequestException);

      expect(bookingsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel a booking', async () => {
      const booking = createBookingEntity();

      bookingsRepository.findOne.mockResolvedValue(booking);
      bookingsRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await bookingsService.cancel(bookingId);

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(bookingsRepository.save).toHaveBeenCalledWith(booking);
    });
  });
});
