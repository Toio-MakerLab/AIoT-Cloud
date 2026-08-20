import { ApiProperty } from '@nestjs/swagger';

import { ErrorCode } from '../../constants/error-code.ts';

export class ResponseCore<T = unknown> {
  @ApiProperty({ enum: ErrorCode, example: ErrorCode.SUCCESS })
  readonly error: ErrorCode;

  @ApiProperty({ nullable: true })
  readonly data: T | null;

  @ApiProperty()
  readonly message: string;

  constructor(error: ErrorCode, data: T | null, message: string) {
    this.error = error;
    this.data = data;
    this.message = message;
  }

  static ok<T>(data: T, message = 'success'): ResponseCore<T> {
    return new ResponseCore(ErrorCode.SUCCESS, data, message);
  }

  static fail<T = never>(error: ErrorCode, message: string): ResponseCore<T> {
    return new ResponseCore<T>(error, null, message);
  }
}
