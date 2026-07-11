import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

interface UsersServiceMock {
  findByEmail: jest.Mock;
  findByEmailWithPassword: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
}

interface JwtServiceMock {
  signAsync: jest.Mock;
  verifyAsync: jest.Mock;
}

interface ConfigServiceMock {
  getOrThrow: jest.Mock;
}

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersServiceMock;
  let jwtService: JwtServiceMock;
  let configService: ConfigServiceMock;

  const plainPassword = 'StrongPassword123';

  const createUser = (overrides: Partial<User> = {}): User => ({
    id: '81b65469-5231-4929-bd8e-0e7a3fc6bb80',
    email: 'intern.test@example.com',
    passwordHash: 'stored-password-hash',
    createdAt: new Date('2026-07-11T06:20:24.562Z'),
    updatedAt: new Date('2026-07-11T06:20:24.562Z'),
    ...overrides,
  });

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    configService = {
      getOrThrow: jest.fn((key: string): string => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: 'test-access-secret',
          JWT_ACCESS_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };

        const value = values[key];

        if (!value) {
          throw new Error(`Missing test configuration: ${key}`);
        }

        return value;
      }),
    };

    authService = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  describe('register', () => {
    it('should register a valid user', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      usersService.create.mockImplementation(
        (email: string, passwordHash: string): Promise<User> =>
          Promise.resolve(
            createUser({
              email,
              passwordHash,
            }),
          ),
      );

      const result = await authService.register({
        email: 'Intern.Test@example.com',
        password: plainPassword,
      });

      expect(result).toEqual({
        id: '81b65469-5231-4929-bd8e-0e7a3fc6bb80',
        email: 'intern.test@example.com',
        createdAt: new Date('2026-07-11T06:20:24.562Z'),
      });

      expect(result).not.toHaveProperty('passwordHash');
      expect(usersService.create).toHaveBeenCalledTimes(1);
    });

    it('should reject a duplicate email', async () => {
      usersService.findByEmail.mockResolvedValue(createUser());

      await expect(
        authService.register({
          email: 'intern.test@example.com',
          password: plainPassword,
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should hash the password before saving the user', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      usersService.create.mockImplementation(
        (email: string, passwordHash: string): Promise<User> =>
          Promise.resolve(
            createUser({
              email,
              passwordHash,
            }),
          ),
      );

      await authService.register({
        email: 'intern.test@example.com',
        password: plainPassword,
      });

      const createCall = usersService.create.mock.calls[0] as [string, string];

      const savedPasswordHash = createCall[1];

      expect(savedPasswordHash).not.toBe(plainPassword);

      expect(await bcrypt.compare(plainPassword, savedPasswordHash)).toBe(true);
    });
  });

  describe('login', () => {
    it('should return tokens for correct credentials', async () => {
      const passwordHash = await bcrypt.hash(plainPassword, 4);

      usersService.findByEmailWithPassword.mockResolvedValue(
        createUser({ passwordHash }),
      );

      jwtService.signAsync
        .mockResolvedValueOnce('test-access-token')
        .mockResolvedValueOnce('test-refresh-token');

      const result = await authService.login({
        email: 'Intern.Test@example.com',
        password: plainPassword,
      });

      expect(result).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });

      expect(usersService.findByEmailWithPassword).toHaveBeenCalledWith(
        'intern.test@example.com',
      );

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('should reject an incorrect password', async () => {
      const passwordHash = await bcrypt.hash(plainPassword, 4);

      usersService.findByEmailWithPassword.mockResolvedValue(
        createUser({ passwordHash }),
      );

      await expect(
        authService.login({
          email: 'intern.test@example.com',
          password: 'WrongPassword123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const user = createUser();

      jwtService.verifyAsync.mockResolvedValue({
        sub: user.id,
        email: user.email,
      });

      usersService.findById.mockResolvedValue(user);

      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await authService.refresh({
        refreshToken: 'valid-refresh-token',
      });

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-refresh-token',
        {
          secret: 'test-refresh-secret',
        },
      );

      expect(usersService.findById).toHaveBeenCalledWith(user.id);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('should reject an invalid refresh token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(
        authService.refresh({
          refreshToken: 'invalid-refresh-token',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(usersService.findById).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});
