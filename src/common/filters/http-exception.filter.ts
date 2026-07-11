import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorMessage = string | string[];

interface ExceptionDetails {
  message: ErrorMessage;
  error: string;
}

interface ErrorResponse {
  statusCode: number;
  message: ErrorMessage;
  error: string;
  timestamp: string;
  path: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function formatHttpStatus(statusCode: number): string {
  const statusName = HttpStatus[statusCode];

  if (typeof statusName !== 'string') {
    return 'Error';
  }

  return statusName
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!(exception instanceof HttpException)) {
      const errorDetails =
        exception instanceof Error
          ? (exception.stack ?? exception.message)
          : String(exception);

      this.logger.error(errorDetails);
    }

    const details = this.resolveExceptionDetails(exception, statusCode);

    const errorResponse: ErrorResponse = {
      statusCode,
      message: details.message,
      error: details.error,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    };

    response.status(statusCode).json(errorResponse);
  }

  private resolveExceptionDetails(
    exception: unknown,
    statusCode: number,
  ): ExceptionDetails {
    const defaultError = formatHttpStatus(statusCode);

    if (!(exception instanceof HttpException)) {
      return {
        message: 'Internal server error',
        error: defaultError,
      };
    }

    const exceptionResponse: unknown = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return {
        message: exceptionResponse,
        error: defaultError,
      };
    }

    if (!isRecord(exceptionResponse)) {
      return {
        message: exception.message,
        error: defaultError,
      };
    }

    const responseMessage = exceptionResponse.message;
    const responseError = exceptionResponse.error;

    const message: ErrorMessage =
      typeof responseMessage === 'string' || isStringArray(responseMessage)
        ? responseMessage
        : exception.message;

    const error =
      typeof responseError === 'string' ? responseError : defaultError;

    return {
      message,
      error,
    };
  }
}
