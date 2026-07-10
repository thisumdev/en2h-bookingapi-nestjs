import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const databasePort = Number.parseInt(
  getRequiredEnvironmentVariable('DATABASE_PORT'),
  10,
);

if (Number.isNaN(databasePort)) {
  throw new Error('DATABASE_PORT must be a valid number');
}

const dataSource = new DataSource({
  type: 'postgres',
  host: getRequiredEnvironmentVariable('DATABASE_HOST'),
  port: databasePort,
  database: getRequiredEnvironmentVariable('DATABASE_NAME'),
  username: getRequiredEnvironmentVariable('DATABASE_USERNAME'),
  password: getRequiredEnvironmentVariable('DATABASE_PASSWORD'),

  entities: [User, ServiceEntity, Booking],

  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',

  synchronize: false,
});

export default dataSource;
