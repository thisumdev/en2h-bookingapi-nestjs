import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceEntity } from '../../services/entities/service.entity';
import { BookingStatus } from '../enums/booking-status.enum';

@Entity('bookings')
@Unique('UQ_bookings_service_date_time', [
  'serviceId',
  'bookingDate',
  'bookingTime',
])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  customerName!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  customerEmail!: string;

  @Column({
    type: 'varchar',
    length: 30,
  })
  customerPhone!: string;

  @Column({
    type: 'uuid',
  })
  serviceId!: string;

  @Column({
    type: 'date',
  })
  bookingDate!: string;

  @Column({
    type: 'time',
  })
  bookingTime!: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    enumName: 'booking_status_enum',
    default: BookingStatus.PENDING,
  })
  status!: BookingStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes!: string | null;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt!: Date;

  @ManyToOne(() => ServiceEntity, (service) => service.bookings, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'serviceId',
  })
  service!: ServiceEntity;
}
