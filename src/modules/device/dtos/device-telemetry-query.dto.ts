import { DateFieldOptional, NumberFieldOptional } from '../../../decorators/field.decorators.ts';

export class DeviceTelemetryQueryDto {
  @NumberFieldOptional({ minimum: 1, maximum: 500, default: 100, int: true })
  readonly limit!: number;

  /** Inclusive lower bound on `recordedAt`. Omit for "as far back as `limit` reaches". */
  @DateFieldOptional()
  readonly from?: Date;

  /** Inclusive upper bound on `recordedAt`. Omit to mean "up to now". */
  @DateFieldOptional()
  readonly to?: Date;
}
