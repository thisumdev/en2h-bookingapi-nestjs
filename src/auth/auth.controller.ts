import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthTokens } from './interfaces/auth-token.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new authenticated system user',
  })
  @ApiCreatedResponse({
    description: 'User registered successfully',
  })
  @ApiBadRequestResponse({
    description: 'The submitted registration data is invalid',
  })
  @ApiConflictResponse({
    description: 'An account with this email already exists',
  })
  register(@Body() registerDto: RegisterDto): Promise<{
    id: string;
    email: string;
    createdAt: Date;
  }> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in using an email address and password',
  })
  @ApiOkResponse({
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'access-token-value',
        refreshToken: 'refresh-token-value',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'The submitted login data is invalid',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
  })
  login(@Body() loginDto: LoginDto): Promise<AuthTokens> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Issue new access and refresh tokens',
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
    schema: {
      example: {
        accessToken: 'new-access-token-value',
        refreshToken: 'new-refresh-token-value',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'The refresh token field is missing or invalid',
  })
  @ApiUnauthorizedResponse({
    description: 'The refresh token is invalid or expired',
  })
  refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    return this.authService.refresh(refreshTokenDto);
  }
}
