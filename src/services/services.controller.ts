import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceEntity } from './entities/service.entity';
import { ServicesService } from './services.service';

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new service',
  })
  @ApiCreatedResponse({
    description: 'Service created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid service data',
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid',
  })
  create(@Body() createServiceDto: CreateServiceDto): Promise<ServiceEntity> {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all services',
  })
  @ApiOkResponse({
    description: 'Services retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid',
  })
  findAll(): Promise<ServiceEntity[]> {
    return this.servicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a service by ID',
  })
  @ApiOkResponse({
    description: 'Service retrieved successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid service ID',
  })
  @ApiNotFoundResponse({
    description: 'Service not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid',
  })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ServiceEntity> {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing service',
  })
  @ApiOkResponse({
    description: 'Service updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid service ID or update data',
  })
  @ApiNotFoundResponse({
    description: 'Service not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid',
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceEntity> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a service',
  })
  @ApiOkResponse({
    description: 'Service deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid service ID',
  })
  @ApiNotFoundResponse({
    description: 'Service not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid',
  })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ message: string }> {
    await this.servicesService.remove(id);

    return {
      message: 'Service deleted successfully',
    };
  }
}
