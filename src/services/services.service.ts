import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceEntity } from './entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly servicesRepository: Repository<ServiceEntity>,
  ) {}

  create(createServiceDto: CreateServiceDto): Promise<ServiceEntity> {
    const service = this.servicesRepository.create({
      title: createServiceDto.title,
      description: createServiceDto.description,
      duration: createServiceDto.duration,
      price: createServiceDto.price.toFixed(2),
      isActive: createServiceDto.isActive ?? true,
    });

    return this.servicesRepository.save(service);
  }

  findAll(): Promise<ServiceEntity[]> {
    return this.servicesRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.servicesRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceEntity> {
    const service = await this.findOne(id);

    if (updateServiceDto.title !== undefined) {
      service.title = updateServiceDto.title;
    }

    if (updateServiceDto.description !== undefined) {
      service.description = updateServiceDto.description;
    }

    if (updateServiceDto.duration !== undefined) {
      service.duration = updateServiceDto.duration;
    }

    if (updateServiceDto.price !== undefined) {
      service.price = updateServiceDto.price.toFixed(2);
    }

    if (updateServiceDto.isActive !== undefined) {
      service.isActive = updateServiceDto.isActive;
    }

    return this.servicesRepository.save(service);
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);

    await this.servicesRepository.remove(service);
  }
}
