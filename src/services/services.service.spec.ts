import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceEntity } from './entities/service.entity';
import { ServicesService } from './services.service';

interface ServicesRepositoryMock {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  remove: jest.Mock;
}

describe('ServicesService', () => {
  let servicesService: ServicesService;
  let servicesRepository: ServicesRepositoryMock;

  const serviceId = 'e0a72d83-e59b-4c82-a89d-361eca0d79c5';

  const createServiceEntity = (
    overrides: Partial<ServiceEntity> = {},
  ): ServiceEntity =>
    Object.assign(new ServiceEntity(), {
      id: serviceId,
      title: 'Full Body Massage',
      description: 'A relaxing full body massage session.',
      duration: 60,
      price: '4500.00',
      isActive: true,
      createdAt: new Date('2026-07-11T08:00:00.000Z'),
      updatedAt: new Date('2026-07-11T08:00:00.000Z'),
      ...overrides,
    });

  beforeEach(() => {
    servicesRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    servicesService = new ServicesService(
      servicesRepository as unknown as Repository<ServiceEntity>,
    );
  });

  describe('create', () => {
    it('should create a service', async () => {
      const createServiceDto: CreateServiceDto = {
        title: 'Full Body Massage',
        description: 'A relaxing full body massage session.',
        duration: 60,
        price: 4500,
      };

      const unsavedService = createServiceEntity({
        id: undefined,
      });

      const savedService = createServiceEntity();

      servicesRepository.create.mockReturnValue(unsavedService);
      servicesRepository.save.mockResolvedValue(savedService);

      const result = await servicesService.create(createServiceDto);

      expect(servicesRepository.create).toHaveBeenCalledWith({
        title: 'Full Body Massage',
        description: 'A relaxing full body massage session.',
        duration: 60,
        price: '4500.00',
        isActive: true,
      });

      expect(servicesRepository.save).toHaveBeenCalledWith(unsavedService);

      expect(result).toEqual(savedService);
    });
  });

  describe('findOne', () => {
    it('should return a service by ID', async () => {
      const service = createServiceEntity();

      servicesRepository.findOne.mockResolvedValue(service);

      const result = await servicesService.findOne(serviceId);

      expect(servicesRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: serviceId,
        },
      });

      expect(result).toEqual(service);
    });

    it('should throw NotFoundException when service does not exist', async () => {
      servicesRepository.findOne.mockResolvedValue(null);

      await expect(servicesService.findOne(serviceId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return a service', async () => {
      const existingService = createServiceEntity();

      const updatedService = createServiceEntity({
        price: '5000.00',
        isActive: false,
      });

      servicesRepository.findOne.mockResolvedValue(existingService);
      servicesRepository.save.mockResolvedValue(updatedService);

      const result = await servicesService.update(serviceId, {
        price: 5000,
        isActive: false,
      });

      expect(existingService.price).toBe('5000.00');
      expect(existingService.isActive).toBe(false);

      expect(servicesRepository.save).toHaveBeenCalledWith(existingService);

      expect(result).toEqual(updatedService);
    });
  });

  describe('remove', () => {
    it('should delete an existing service', async () => {
      const service = createServiceEntity();

      servicesRepository.findOne.mockResolvedValue(service);
      servicesRepository.remove.mockResolvedValue(service);

      await servicesService.remove(serviceId);

      expect(servicesRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: serviceId,
        },
      });

      expect(servicesRepository.remove).toHaveBeenCalledWith(service);
    });
  });
});
