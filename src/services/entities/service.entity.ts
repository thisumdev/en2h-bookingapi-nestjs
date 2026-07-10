import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('services')
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  title!: string;

  @Column({
    type: 'text',
  })
  description!: string;

  @Column({
    type: 'integer',
  })
  duration!: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  price!: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt!: Date;

  @OneToMany(() => Booking, (booking) => booking.service)
  bookings!: Booking[];
}
