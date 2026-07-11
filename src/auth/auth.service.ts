import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuthTokens } from './interfaces/auth-token.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    id: string;
    email: string;
    createdAt: Date;
  }> {
    const normalizedEmail = registerDto.email.trim().toLowerCase();

    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(
      registerDto.password,
      BCRYPT_SALT_ROUNDS,
    );

    try {
      const user = await this.usersService.create(
        normalizedEmail,
        passwordHash,
      );

      return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      };
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }

      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    const user = await this.validateCredentials(loginDto);

    return this.generateTokens(user);
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshTokenDto.refreshToken,
        {
          secret: refreshSecret,
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.generateTokens({
      id: user.id,
      email: user.email,
    });
  }

  async validateCredentials(loginDto: LoginDto): Promise<AuthenticatedUser> {
    const normalizedEmail = loginDto.email.trim().toLowerCase();

    const user =
      await this.usersService.findByEmailWithPassword(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
    };
  }

  private async generateTokens(user: AuthenticatedUser): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessSecret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    const accessExpiresIn = this.configService.getOrThrow<string>(
      'JWT_ACCESS_EXPIRES_IN',
    ) as JwtSignOptions['expiresIn'];

    const refreshExpiresIn = this.configService.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    ) as JwtSignOptions['expiresIn'];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as {
      code?: string;
    };

    return driverError.code === '23505';
  }
}
