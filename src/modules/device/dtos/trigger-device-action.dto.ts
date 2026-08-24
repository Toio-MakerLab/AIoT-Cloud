import { StringField } from '../../../decorators/field.decorators.ts';

export class TriggerDeviceActionDto {
  /** Must match a `key` in the device's template `actionSchema`. */
  @StringField()
  key!: string;

  /** For TOGGLE actions, must equal the definition's `onValue`/`offValue`. Free-form for BUTTON actions. */
  @StringField()
  value!: string;
}
