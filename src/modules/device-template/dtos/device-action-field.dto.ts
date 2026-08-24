import { DeviceActionType } from '../../../constants/device-action-type.ts';
import { EnumField, StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';

export class DeviceActionFieldDto {
  @StringField()
  key!: string;

  @StringField()
  label!: string;

  @EnumField(() => DeviceActionType)
  type!: DeviceActionType;

  /** Value published when a TOGGLE action is switched on, e.g. "ON". */
  @StringFieldOptional()
  onValue?: string;

  /** Value published when a TOGGLE action is switched off, e.g. "OFF". */
  @StringFieldOptional()
  offValue?: string;
}
