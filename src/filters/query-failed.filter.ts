import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

import { ResponseCore } from '../common/dto/response-core.dto.ts';
import { constraintErrors } from './constraint-errors.ts';

@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter<QueryFailedError> {
  constructor(public reflector: Reflector) {}

  catch(exception: QueryFailedError & { constraint?: string }, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.constraint?.startsWith('UQ') ? HttpStatus.CONFLICT : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = (exception.constraint && constraintErrors[exception.constraint]) || 'error.internalServerError';

    response.status(status).json(new ResponseCore(status as any, null, message));
  }
}
