import { NumberFieldOptional } from '../../../decorators/field.decorators.ts';

export class DeviceTelemetryQueryDto {
  @NumberFieldOptional({ minimum: 1, maximum: 500, default: 100, int: true })
  readonly limit!: number;
}
