# EN2H Booking Platform API

## Project Overview

A REST API for managing services and customer bookings, developed for the EN2H Software Engineer Intern technical assessment.

Authenticated users can manage services and bookings. Customers can create bookings without authentication.

## Technology Stack

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- JWT Authentication
- Swagger / OpenAPI
- Docker and Docker Compose
- Jest
- npm

## Prerequisites

Install the following:

- Node.js
- npm
- Docker Desktop
- Git

## Installation Steps

Clone the repository:

```bash
git clone <repository-url>
```

Move into the project folder:

```bash
cd en2h-bookingapi-nestjs
```

Install dependencies:

```bash
npm install
```

Create a local environment file.

Windows Command Prompt:

```cmd
copy .env.example .env
```

macOS or Linux:

```bash
cp .env.example .env
```

Update the values inside `.env` before running the project.

## Environment Variables

```env
NODE_ENV=development
PORT=3000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=en2h_booking
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_database_password

JWT_ACCESS_SECRET=your_access_token_secret
JWT_ACCESS_EXPIRES_IN=15m

JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=7d
```

Do not commit the real `.env` file.

## Database Setup

Start PostgreSQL using Docker:

```bash
docker compose up -d db
```

Check the container status:

```bash
docker compose ps
```

The project uses PostgreSQL with TypeORM migrations. Database synchronization is disabled.

## Running Migrations

Run pending migrations:

```bash
npm run migration:run
```

View migration status:

```bash
npm run migration:show
```

Revert the latest migration:

```bash
npm run migration:revert
```

The current migration is:

```text
InitialSchema1783678267184
```

## Running the Application

Start PostgreSQL:

```bash
docker compose up -d db
```

Run migrations:

```bash
npm run migration:run
```

Start the application in development mode:

```bash
npm run start:dev
```

API base URL:

```text
http://localhost:3000/api
```

Swagger documentation:

```text
http://localhost:3000/api/docs
```

Build the project:

```bash
npm run build
```

Run the production build:

```bash
npm run start:prod
```

## Docker Instructions

Build and start the API and PostgreSQL together:

```bash
docker compose up --build -d
```

Check the containers:

```bash
docker compose ps
```

View API logs:

```bash
docker compose logs -f api
```

The API container waits for PostgreSQL, runs pending migrations, and then starts the application.

Stop the containers without deleting database data:

```bash
docker compose down
```

Do not use `docker compose down -v` unless you intentionally want to delete the database volume.

## Running Unit Tests

Run all unit tests:

```bash
npm test -- --runInBand
```

Run the linter:

```bash
npm run lint
```

Build the project:

```bash
npm run build
```

## API Documentation

Swagger is used for API documentation.

Open:

```text
http://localhost:3000/api/docs
```

For protected endpoints:

1. Register or log in.
2. Copy the returned access token.
3. Click **Authorize** in Swagger.
4. Enter the access token.

## Main Endpoints

### Authentication

| Method | Endpoint             | Access |
| ------ | -------------------- | ------ |
| POST   | `/api/auth/register` | Public |
| POST   | `/api/auth/login`    | Public |
| POST   | `/api/auth/refresh`  | Public |

### Services

| Method | Endpoint            | Access    |
| ------ | ------------------- | --------- |
| POST   | `/api/services`     | Protected |
| GET    | `/api/services`     | Protected |
| GET    | `/api/services/:id` | Protected |
| PATCH  | `/api/services/:id` | Protected |
| DELETE | `/api/services/:id` | Protected |

### Bookings

| Method | Endpoint                   | Access    |
| ------ | -------------------------- | --------- |
| POST   | `/api/bookings`            | Public    |
| GET    | `/api/bookings`            | Protected |
| GET    | `/api/bookings/:id`        | Protected |
| PATCH  | `/api/bookings/:id/status` | Protected |
| PATCH  | `/api/bookings/:id/cancel` | Protected |

Booking listing supports pagination, search, and status filtering:

```http
GET /api/bookings?page=1&limit=10
```

```http
GET /api/bookings?search=kamal
```

```http
GET /api/bookings?status=PENDING
```

## Project Structure

```text
src/
├── auth/
├── bookings/
├── common/
├── database/
├── services/
├── users/
├── app.module.ts
└── main.ts
```

## Assumptions Made

- Registration uses email and password.
- All service endpoints require authentication.
- Booking creation is public.
- Other booking endpoints require authentication.
- Service duration is stored in minutes.
- New bookings start with `PENDING`.
- Swagger is used instead of a Postman collection.

## Future Improvements

Possible future improvements include role-based access control, customer accounts, notifications, booking rescheduling, end-to-end tests, and cloud deployment.
