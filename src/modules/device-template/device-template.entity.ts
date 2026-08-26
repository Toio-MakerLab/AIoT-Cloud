import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import type { DeviceActionType } from '../../constants/device-action-type.ts';
import { DeviceTemplateType } from '../../constants/device-template-type.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { DeviceTemplateDto } from './dtos/device-template.dto.ts';

export interface TelemetryFieldDefinition {
  key: string;
  label: string;
  unit?: string;
  /** Default warning band for this field; a device can override via `DeviceEntity.warningOverrides`. */
  warningMin?: number;
  warningMax?: number;
}

export interface ActionFieldDefinition {
  key: string;
  label: string;
  type: DeviceActionType;
  onValue?: string;
  offValue?: string;
}

@Entity({ name: 'device_templates' })
@UseDto(DeviceTemplateDto)
export class DeviceTemplateEntity extends AbstractEntity<DeviceTemplateDto> {
  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'enum', enum: DeviceTemplateType, default: DeviceTemplateType.OTHER })
  type!: DeviceTemplateType;

  @Column({ nullable: true, type: 'varchar' })
  description!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  manufacturer!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  icon!: string | null;

  @Column({ nullable: true, type: 'jsonb' })
  telemetrySchema!: TelemetryFieldDefinition[] | null;

  @Column({ nullable: true, type: 'jsonb' })
  actionSchema!: ActionFieldDefinition[] | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
