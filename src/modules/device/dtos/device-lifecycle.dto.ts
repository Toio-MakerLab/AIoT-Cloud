import { DeviceLifecycleStage } from '../../../constants/device-lifecycle-stage.ts';
import { DateFieldOptional, NumberFieldOptional } from '../../../decorators/field.decorators.ts';

export class UpdateDeviceLifecycleDto {
  /** Commissioning date; `null` clears the override and falls back to the device's `createdAt`. */
  @DateFieldOptional({ nullable: true })
  installedAt?: Date | null;

  /** Expected months of service; `null` clears the override and falls back to DEFAULT_EXPECTED_LIFESPAN_MONTHS. */
  @NumberFieldOptional({ nullable: true, int: true, isPositive: true })
  expectedLifespanMonths?: number | null;
}

/** One weighted component behind an assessment's overall `score` — see DeviceLifecycleService.assessDevice. */
export interface DeviceLifecycleFactor {
  key: 'age' | 'connectivity' | 'telemetryHealth';
  label: string;
  /** 0-100; higher is healthier. */
  score: number;
  /** This factor's share of the overall score, 0-1; all factors sum to 1. */
  weight: number;
  /** Human-readable explanation of how `score` was reached. */
  detail: string;
}

/** Response for GET .../lifecycle — recomputed fresh on every call and persisted onto the device. */
export class DeviceLifecycleAssessmentDto {
  deviceId!: string;
  stage!: DeviceLifecycleStage;
  /** 0-100 weighted average of `factors`. */
  score!: number;
  installedAt!: Date;
  expectedLifespanMonths!: number;
  ageMonths!: number;
  /** `expectedLifespanMonths - ageMonths`; can go negative once the device outlives its expected lifespan. */
  remainingLifespanMonths!: number;
  factors!: DeviceLifecycleFactor[];
  assessedAt!: Date;
  decommissionedAt!: Date | null;
}
