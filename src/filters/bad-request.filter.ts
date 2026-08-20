import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, UnprocessableEntityException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ValidationError } from 'class-validator';
import type { Response } from 'express';
import _ from 'lodash';

import { ResponseCore } from '../common/dto/response-core.dto.ts';
import { ErrorCode } from '../constants/error-code.ts';

@Catch(UnprocessableEntityException)
export class HttpExceptionFilter implements ExceptionFilter<UnprocessableEntityException> {
  constructor(public reflector: Reflector) {}

  catch(exception: UnprocessableEntityException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = exception.getStatus();
    const r = exception.getResponse() as { message: ValidationError[] };

    const validationErrors = r.message;
    this.validationFilter(validationErrors);

    response.status(statusCode).json(new ResponseCore(ErrorCode.BAD_REQUEST, validationErrors, 'error.validation'));
  }

  private validationFilter(validationErrors: ValidationError[]): void {
    for (const validationError of validationErrors) {
      const children = validationError.children;

      if (children && !_.isEmpty(children)) {
        this.validationFilter(children);

        return;
      }

      delete validationError.children;

      const constraints = validationError.constraints;

      if (!constraints) {
        return;
      }

      for (const [constraintKey, constraint] of Object.entries(constraints)) {
        // convert default messages
        if (!constraint) {
          // convert error message to error.fields.{key} syntax for i18n translation
          constraints[constraintKey] = `error.fields.${_.snakeCase(constraintKey)}`;
        }
      }
    }
  }
}
